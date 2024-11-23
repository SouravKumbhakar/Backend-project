const express = require('express');
const app = express();
const cookiParser = require('cookie-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const userModel = require('./models/user');
const postModel = require('./models/post');
const bcrypt = require('bcrypt');
const { log } = require('util');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookiParser());

app.get('/', (req,res)=>{
    res.render("index")
});

app.get('/login' , (req,res)=>{
    res.render('login')
})

app.post('/register', async (req,res)=>{
    let {email, password, username, name, dob} = req.body;
    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("user already registter");

    bcrypt.genSalt(10 , (err,salt)=>{
        bcrypt.hash(password, salt , async (err,hash)=>{
           let user = await userModel.create({
            username,
            email,
            dob,
            name,
            dob,
            password:hash
           });

           let token = jwt.sign({email:email, userid: user._id}, "shhhh");
           res.cookie("token",token);
           res.send("user registered successfully");

        })    
    });
    
});

app.post('/login',async (req,res)=>{
    let {email, password} = req.body;
    let user = await userModel.findOne({email});
    
    if(!user) return res.status(500).send("Something went wrong");
    
    bcrypt.compare(password, user.password , async (err,result)=>{
        if(result){
            let token = jwt.sign({email:email, userid: user._id}, "shhhh");
            res.cookie("token",token); 
            res.status(200).send("you can log in");
        }
        else res.redirect("/login") 
    })

})

app.get('/logout', (req,res)=>{
    res.cookie("token", "");
    res.redirect('/login');
});

app.get('/profile',isLoggedIn, (req,res)=>{
    console.log(req.user);
    
    res.send('Profile page');
})

//function for warn any page to login
function isLoggedIn(req,res, next){
    if(req.cookies.token == ""){
        res.send("You must be logged in");
    } 
    else{
        let data = jwt.verify(req.cookies.token, "shhhh")
        req.user = data;
        next(); 
    }
}

app.listen(3000, ()=>{
    console.log("server on");
});