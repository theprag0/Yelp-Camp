require('dotenv').config()
var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground");
var Comment=require("../models/comment");
var middleware=require("../middleware");
var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);

//INDEX - show all campgrounds
router.get("/", function(req, res){
    // Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
       if(err){
           console.log(err);
       } else {
          res.render("campgrounds/camps",{campgrounds:allCampgrounds,page:"campgrounds"});
       }
    });
});

//CREATE - add new campground to DB
router.post("/",middleware.isLoggedIn,function(req, res){
    // get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var price=req.body.price;
    var desc = req.body.description;
    var author={
        id:req.user._id,
        username:req.user.username
    }
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          console.log(err);
          return res.redirect('back');
        }
    
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
    var newCampground = {name: name,price:price, image: image, description: desc,author:author,location:location,lat:lat,lng:lng}
    // Create a new campground and save to DB
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            req.flash("error","Something went wrong, Please try again later.")
            console.log(err);
        } else {
            req.flash("success","Campground added successfully!")
            //redirect back to campgrounds page
            res.redirect("/campgrounds");
        }
    });
    });
});

//NEW - show form to create new campground
router.get("/new",middleware.isLoggedIn, function(req, res){
   res.render("campgrounds/new"); 
});

// SHOW - shows more info about one campground
router.get("/:id", function(req, res){
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            console.log(err);
            req.flash('error', 'Sorry, that campground does not exist!');
            return res.redirect('/campgrounds');
        }
        //render show template with that campground
        res.render("campgrounds/show", {campground: foundCampground});
    });
});

// UPDATE ROUTES
router.get("/:id/edit", middleware.isLoggedIn, middleware.checkCampgroundOwnership, function(req, res){
    //render edit template with that campground
    res.render("campgrounds/edit", {campground: req.campground});
  });

router.put("/:id",middleware.checkCampgroundOwnership,function(req,res){
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
          req.flash('error', 'Invalid address');
          return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
    
    Campground.findByIdAndUpdate(req.params.id,req.body.data,function(err,camp){
        if(err){
            req.flash("error","Something went wrong, Please try again later.")
            res.redirect("/campgrounds");
        }else{
            req.flash("success","Campground edited successfully!")
            res.redirect("/campgrounds/"+req.params.id)
        }
    });
    });
});

// DELETE CAMPGROUND ROUTES
router.delete("/:id",middleware.checkCampgroundOwnership,function(req,res){
    Campground.findByIdAndRemove(req.params.id,function(err){
        if(err){
            req.flash("error","Something went wrong, Please try again later.")
            res.redirect("/campgrounds/"+req.params.id);
        }else{
            req.flash("success","Campground deleted!");
            res.redirect("/campgrounds");
        }
    })
})

module.exports=router;