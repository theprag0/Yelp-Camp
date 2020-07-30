var express=require("express");
var router=express.Router({mergeParams:true});
var passport=require("passport");
var Campground=require("../models/campground");
var Comment=require("../models/comment");
var User=require("../models/user");
var middleware=require("../middleware");

router.get("/", function(req, res){
    res.render("home");
});

// AUTH ROUTES
router.get("/register",function(req,res){
    res.render("register");
})

router.post("/register",function(req,res){
    var newUser=new User({username:req.body.username});
    User.register(newUser,req.body.password,function(err,user){
      if(err){
          req.flash("error",err.message);
          res.redirect("/register");
      }
      passport.authenticate("local")(req,res,function(){
          req.flash("success","Welcome to YelpCamp, "+user.username+"!");
          res.redirect("/campgrounds");
      })
    })
})

// LOGIN ROUTES
router.get("/login",function(req,res){
    res.render("login");
})

router.post("/login", function (req, res, next) {
    passport.authenticate("local",
      {
        successRedirect: "/campgrounds",
        failureRedirect: "/login",
        failureFlash: true,
        successFlash: "Welcome back, " + req.body.username + "!"
      })(req, res);
  });
router.get("/logout",function(req,res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/campgrounds");
})

module.exports=router;