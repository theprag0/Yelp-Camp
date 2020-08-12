require('dotenv').config();
var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground");
var Comment=require("../models/comment");
var Review=require("../models/review");
var middleware=require("../middleware");
var NodeGeocoder = require('node-geocoder');
var path=require("path")
const helpers = require('../helpers');
const multer = require('multer');
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  });
var upload = multer({ storage: storage, fileFilter: helpers.imageFilter })
var cloudinary = require('cloudinary');
const campground = require('../models/campground');
cloudinary.config({
    cloud_name:"prag",
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
}) 

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    var perPage=8;
    var pageQuery=parseInt(req.query.page);
    var pageNumber=pageQuery?pageQuery:1;
    var noMatch=null;
    if(req.query.search){
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name:regex}).skip((perPage*pageNumber)-perPage).limit(perPage).exec(function(err, allCampgrounds){
          Campground.count({name:regex}).exec(function(err,count){
            if(err){
              console.log(err);
              res.redirect("back");
          } else {
              if(allCampgrounds.length<1){
                  noMatch="No campgrounds found, Please try again.";
              }
             res.render("campgrounds/camps",
             {campgrounds:allCampgrounds,page:"campgrounds",
             noMatch:noMatch,
             current:pageNumber,
             search:req.query.search,
             pages:Math.ceil(count/perPage)
            });
           }
         })  
      });
    }else{
    // Get all campgrounds from DB
    Campground.find({}).skip((perPage*pageNumber)-perPage).limit(perPage).exec(
      function(err, allCampgrounds){
        Campground.count({}).exec(function(err,count){
          if(err){
            console.log(err);
            res.redirect("back");
        } else {
           res.render("campgrounds/camps",{campgrounds:allCampgrounds,
            page:"campgrounds",
            noMatch:noMatch,
            current:pageNumber,
            pages: Math.ceil(count / perPage),
            search: false
          });
        }
        })
     }); 
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
        return res.redirect('back');
      }
      // add cloudinary url for the image to the campground object under image property
      req.body.campground.image = result.secure_url;
      // add image's public_id to campground object
      req.body.campground.imageId = result.public_id;
      // add author to campground
      req.body.campground.author = {
        id: req.user._id,
        username: req.user.username
      }
      Campground.create(req.body.campground, function(err, campground) {
        if (err) {
          console.log(err);
          req.flash('error', err.message);
          return res.redirect('back');
        }
        req.flash("success","Campground created successfully!");
        res.redirect('/campgrounds');
      });
    });
});
    // geocoder.geocode(req.body.location, function (err, data) {
        // if (err || !data.length) {
        //   req.flash('error', 'Invalid address');
        //   console.log(err);
        //   return res.redirect('back');
        // }
    
        // var lat = data[0].latitude;
        // var lng = data[0].longitude;
        // var location = data[0].formattedAddress;
    // });


//NEW - show form to create new campground
router.get("/new",middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:slug", function (req, res) {
  //find the campground with provided ID
  Campground.findOne({slug:req.params.slug}).populate("comments").populate({
    path:"reviews",
    options:{sort:{createdAt:-1}}
  }).exec(function (err, foundCampground) {
      if (err) {
           req.flash("error","Campground not found, Please try again.")
           res.redirect("back")
          console.log(err);
      } else {
          //render show template with that campground
          res.render("campgrounds/show", {campground: foundCampground});
      }
  });
});

// UPDATE ROUTES
router.get("/:slug/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function(req, res){
    //render edit template with that campground
    res.render("campgrounds/edit", {campground: req.campground});
  });

  router.put("/:slug", upload.single('image'), function(req, res){
    Campground.findOne({slug:req.params.slug}, async function(err, campground){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(campground.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  campground.imageId = result.public_id;
                  campground.image = result.secure_url;
              } catch(err) {
                console.log(err);
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            campground.name = req.body.data.name;
            campground.description = req.body.data.description;
            campground.price = req.body.data.price;
            campground.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/campgrounds/" + campground.slug);
        }
    });
});
    // geocoder.geocode(req.body.location, function (err, data) {
    //     if (err || !data.length) {
    //       req.flash('error', 'Invalid address');
    //       return res.redirect('back');
    //     }
    //     req.body.campground.lat = data[0].latitude;
    //     req.body.campground.lng = data[0].longitude;
    //     req.body.campground.location = data[0].formattedAddress;
    // });

// DELETE CAMPGROUND ROUTES
router.delete('/:slug', function(req, res) {
    Campground.findOneAndRemove({slug:req.params.slug},async function(err, campground) {
      if(err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
      try {
          await cloudinary.v2.uploader.destroy(campground.imageId);
          Comment.remove({"_id":{$in:campground.comments}},function(err){
            if(err){
            req.flash("error","Something went wrong, Please try again.")
            res.redirect("back");
            }
            Review.remove({"_id":{$in:campground.reviews}},function(err){
              if(err){
                req.flash("error","Something went wrong, Please try again.")
                res.redirect("back");
                }
                campground.remove();
                req.flash('success', 'Campground deleted successfully!');
                res.redirect('/campgrounds');
            });
          });
      } catch(err) {
          if(err) {
            req.flash("error", err.message);
            return res.redirect("back");
          }
      }
    });
  });
  
// LIKE ROUTES
router.post("/:slug/like", middleware.isLoggedIn, function (req, res) {
  Campground.findOne({slug:req.params.slug}, function (err, foundCampground) {
      if (err) {
          console.log(err);
          res.redirect("/campgrounds");
      }

      // check if req.user._id exists in foundCampground.likes
      var foundUserLike = foundCampground.likes.some(function (like) {
          return like.equals(req.user._id);
      });

      if (foundUserLike) {
          // user already liked, removing like
          foundCampground.likes.pull(req.user._id);
      } else {
          // adding the new user like
          foundCampground.likes.push(req.user);
      }

      foundCampground.save(function (err) {
          if (err) {
              console.log(err);
              return res.redirect("/campgrounds");
          }
          return res.redirect("/campgrounds/" + foundCampground.slug);
      });
  });
});



function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports=router;