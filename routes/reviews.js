var express=require("express");
var router=express.Router({mergeParams:true});
var Campground=require("../models/campground");
var Review=require("../models/review");
var middleware=require("../middleware/index");

// INDEX ROUTES
router.get("/",function(req,res){
    Campground.findOne({slug:req.params.slug}).populate({
      path:"reviews",
      options:{sort:{createdAt:-1}}
    }).exec(
        function(err,foundCampground){
            if(err || !foundCampground){
                req.flash("error","Something went wrong, Please try again.");
                res.redirect("back");
            }else{
                res.render("reviews/show",{campground:foundCampground});
            }
        })
});

//Create new reviews
router.get("/new",middleware.isLoggedIn,middleware.checkReviewExistence,function(req,res){
    Campground.findOne({slug:req.params.slug},function(err,campground){
        if(err){
            req.flash("error","Something went wrong, Please try again.");
            res.redirect("/campgrounds/"+campground.slug)
        }else{
            res.render("reviews/new",{campground:campground});
        }
    });
});

router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup campground using ID
    Campground.findOne({slug:req.params.slug}).populate("reviews").exec(function (err, campground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated campground to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.campground = campground;
            //save review
            review.save();
            campground.reviews.push(review);
            // calculate the new average review for the campground
            campground.rating = calculateAverage(campground.reviews);
            //save campground
            campground.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/campgrounds/' + campground.slug);
        });
    });
});

// Update reviews
router.get("/:review_id/edit",middleware.checkReviewOwnership,function(req,res){
    Review.findById(req.params.review_id,function(err,foundReview){
        if(err){
            req.flash("error","Unable to edit review, Please try again.");
            res.redirect("/campgrounds/"+req.params.slug);
        }else{
            res.render("reviews/edit",{campground_slug: req.params.slug,review:foundReview});
        }
    })
})

router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Campground.findOne({slug:req.params.slug}).populate("reviews").exec(function (err, campground) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate campground average
            campground.rating = calculateAverage(campground.reviews);
            //save changes
            campground.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/campgrounds/' + campground.slug);
        });
    });
});

// Delete review
router.delete("/:review_id",middleware.checkReviewOwnership,function(req,res){
    Review.findByIdandRemove(req.params.review_id,function(err){
        if(err){
            req.flash("error","Unable to delete review, Please try again.");
            res.redirect("back");
        }
        Campground.findOne({slug:req.params.slug},{$pull:{reviews:req.params.review_id}},{new:true}).populate("reviews").exec(function(err,campground){
            if(err){
                req.flash("error","Something went wrong, Please try again.");
                res.redirect("back");  
            }
            campground.rating=calculateAverage(campground.reviews);
            campground.save();
            req.flash("success","Your review has been deleted.");
            res.redirect("/campgrounds/"+campground.slug);
        })
    })
})

function calculateAverage(reviews){
    if(reviews.length==0){
        return 0;
    }
    var sum=0;
    reviews.forEach(function(element){
        sum+=element.rating;
    });
    return sum/reviews.length;
}

module.exports=router;