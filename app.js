const express = require('express'); //requiring express
const app = express();
const cookieParser = require('cookie-parser'); // cookie parser for generating cookie
const path = require('path'); //require path for direct file access
const jwt = require('jsonwebtoken');// require jwt for send cookies in jwt format
const userModel = require('./models/user');// require user from the database
const postModel = require('./models/post');// require post from the database
const bcrypt = require('bcrypt');//requiring bcrypt for Authentication and authorisation

app.set("view engine", "ejs"); //set up ejs view engine 
app.use(express.json()); //set up middleware
app.use(express.urlencoded({extended: true})); //set up middleware
app.use(express.static(path.join(__dirname, 'public'))) //redirect the short path to public so we are not require to write the full path
app.use(cookieParser());

app.get('/', (req,res)=>{
    res.render('index'); //render to index.ejs 
});

app.get('/login' , (req,res)=>{
    res.render('login'); //rendering login page 
})

app.post('/register', async (req,res)=>{ //this route create user 
    let {email, password, username, name, dob} = req.body; // getting data from index.ejs form
    let user = await userModel.findOne({email}); //find user on the basis of email id cheaking already register or not
    if(user) return res.status(500).send("user already registter");

    bcrypt.genSalt(10 , (err,salt)=>{ // generating slat for cheating hash password
        bcrypt.hash(password, salt , async (err,hash)=>{ // creating hash password for security
           let user = await userModel.create({ // creating user
            username,
            email,
            dob,
            name,
            dob,
            password:hash
           });

           let token = jwt.sign({email:email, userid: user._id}, "shhhh"); // crating jwt token
           res.cookie("token",token); // sending jwt token as cookie
           res.send("user registered successfully"); // sending message

        });    
    });
    
});

app.post('/login',async (req,res)=>{ // creating login route to getting data for login
    let {email, password} = req.body; // getting data from user form of login route
    let user = await userModel.findOne({email}); // finding user on the basis of email 
    if(!user) return res.status(500).send("Something went wrong");
    
    bcrypt.compare(password, user.password , async (err,result)=>{ // cheaking password
        if(result){ // if matched
            let token = jwt.sign({email:email, userid: user._id}, "shhhh"); // generating token 
            res.cookie("token",token); // send token as cookie for long time user uses 
            res.status(200).redirect('/profile'); // if all correct them redirect to profile page
        }
        else res.redirect("/login") // if not matched 
    })

})

app.get('/logout', (req,res)=>{ // creating logout route for removing cookie
    res.cookie("token", ""); 
    res.redirect('/login');
});

app.get('/profile',isLoggedIn, async (req,res)=>{ // crating profile route for logged in user uses
    let user = await userModel.findOne({email: req.user.email});
    await user.populate("posts"); 
    res.render('profile',{user});
})

app.get('/like/:id', isLoggedIn, async (req,res)=>{ // crating profile route for logged in user uses
    let post = await postModel.findOne({_id: req.params.id}).populate("user");    

    if(post.likes.indexOf(req.user.userid) == -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }

    await post.save();
    res.redirect("/profile")
});

app.get('/edit/:id', isLoggedIn, async (req,res)=>{ // crating profile route for logged in user uses
    let post = await postModel.findOne({_id: req.params.id}).populate("user");    
    res.render("edit",{post})
});

app.post('/update/:id',isLoggedIn, async (req,res)=>{ // crating profile route for logged in user uses
    let post = await postModel.findOneAndUpdate({_id: req.params.id}, {content: req.body.content},{new:true});    
    res.redirect('/profile');
});

app.post('/post',isLoggedIn, async (req,res)=>{ // crating profile route for logged in user uses
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;
    
    let post = await postModel.create({
        user: user._id,
        content
    });    

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile')
});

//function for warn any page to login
function isLoggedIn(req,res, next){ // this function cheaks user logged in or not
    if(req.cookies.token == ""){ // cheaking based on cookie
        res.redirect("/login");
    } 
    else{
        let data = jwt.verify(req.cookies.token, "shhhh") // getting data from jwt cookie
        req.user = data; // setting user with the jwt data
        next(); 
    }
}

app.listen(3000, ()=>{ // running server on 3000 port
    console.log("server on");
});