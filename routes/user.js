const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const catchAsync = require('../utilities/catchAsync')

const User = require('../models/user');
const { verifyToken, isLoggedIn } = require('../middleware');


//AUTHENTICATION

router.get('/register', async(req, res) => {
    res.render('register.ejs')
})

router.post('/register',  (catchAsync( async(req, res, next) => {

    try {
    const { first_name, last_name, username, email, password } = req.body;
    if (!(email && password && first_name && last_name && username)) {
        res.status(400).send("All input fields are required")
    }
    // console.log(email && password && first_name && last_name && username)
    console.log(req.body)
    const oldUser = await User.findOne({ email });
    if(oldUser){
        return res.status(409).send("User Already Exist. Login instead")
    }

    hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword)
    // console.log(password)
    const user = await User.create({
        first_name,
        last_name,
        username,
        email: email.toLowerCase(),
        password: hashedPassword
    })

    const token = jwt.sign(
        { user_id: user._id, email },
        process.env.TOKEN_KEY,
        {
            expiresIn: "2h"
        }
    );
    user.token = token;

    res.redirect(`dashboard/${user.id}`)


   
} catch (err) {
  console.log(err);
}
    
})))



router.get('/login', async(req, res) => {
    res.render('login')
})



router.post('/login', catchAsync( async(req, res, next) => {
    try {
        const { username, password } = req.body;

        if(!(username && password)) {
            res.status(400).send("All input fields are required");
        }

        const user = await User.findOne({ username });
        if (user && (await bcrypt.compare(password, user.password))) {
            const token = jwt.sign(
                { user_id: user._id, username },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h"
                }
            );
            user.token = token;
            
            session = req.session
            session.user_id = user.id
            var session

            // res.status(200).json(user)
            res.redirect(`/dashboard/${user.id}`)
          
            console.log(req.session)


        }
        res.status(400).send("Invalid Credentials");
    }catch(err){
        console.log(err);
    }
}))

router.post('/welcome', verifyToken, async(req, res) => {
    return res.status(200).send('Welcome dude')
})


router.get('/logout', catchAsync( async(req, res) => {
    req.session = null;
    res.redirect('/')
}))

module.exports = router;
