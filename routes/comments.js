var express = require("express");
var router  = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware=require("../middleware");

//Comments New
router.get("/new", middleware.isLoggedIn, function(req, res){
    // find campground by id
    Campground.findOne({slug:req.params.slug}, function(err, campground){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {campground: campground});
        }
    })
});

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup campground using ID
   Campground.findOne({slug:req.params.slug}, function(err, campground){
       if(err){
           console.log(err);
           res.redirect("/campgrounds");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               comment.author.avatar=req.user.avatar||"https://t3.ftcdn.net/jpg/01/45/53/32/240_F_145533232_oItfubiWD3H9lhQOv2LwYvWjPHESPTP4.jpg";
               //save comment
               comment.save();
               campground.comments.push(comment);
               campground.save();
               req.flash("success","Comment added successfully!")
               res.redirect('/campgrounds/' + campground.slug);
           }
        });
       }
   });
});

// UPDATE COMMENT ROUTE
router.get("/:comment_id/edit", middleware.isLoggedIn, middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else {
          res.render("comments/edit", {campground_slug: req.params.slug, comment: foundComment});
        }
     });
  });

router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
        if(err){
            res.redirect("back");
        }else{
            req.flash("success","Comment edited succesfully")
            res.redirect("/campgrounds/"+req.params.slug)
        }
    })
})

// DELETE COMMENT ROUTE
router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
            res.redirect("back");
        }else{
            req.flash("success","Deleted Comment!");
            res.redirect("/campgrounds/"+req.params.slug);
        }
    })
})

module.exports = router;
