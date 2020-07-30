var mongoose=require("mongoose");
var Campground=require("./models/campground");
var Comment=require("./models/comment");

var data=[{
    name:"Sahale Glacier Camp, Washington, US",
    image:"https://i.insider.com/5b56542a51dfbe25008b462f?width=700&format=jpeg&auto=webp",
    description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
},{
    name:"Big Red Tent, Kolad, India",
    image:"https://www.holidify.com/images/cmsuploads/compressed/Kolad-tent_20190213131433.jpg",
    description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
},{
    name:"The Oberoi Vanyavilas, Ranthambore, India",
    image:"https://www.holidify.com/images/cmsuploads/compressed/49209820_20190213132038.jpg",
    description:"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
}];

function seedDB(){
    Campground.remove({},function(err){
    //     if(err){
    //         console.log(err);
    //     }
    //     console.log("Removed Campgrounds");
    //     data.forEach(function(seed){
    //         Campground.create(seed,function(err,campground){
    //             if(err){
    //                 console.log(err);
    //             }else{
    //                 console.log("Created a new campground");
    //                 Comment.create({
    //                     text:"This is a good place, with all necessary facilities..Highly Recomended!",
    //                     author:"Hawkeye-Useless Avenger"
    //                 },function(err,comment){
    //                     if(err){
    //                         console.log(err);
    //                     }else{
    //                         campground.comments.push(comment)
    //                         campground.save();
    //                         console.log("Comment added succesfully!");
    //                     }
    //                 })
    //             }
    //         })
    //     })
     })
}

module.exports= seedDB;
