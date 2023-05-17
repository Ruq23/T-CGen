const express = require('express');
const mongoose = require ('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session')

const dotenv = require("dotenv").config();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");


const ExpressError = require('./utilities/ExpressError')
const catchAsync = require('./utilities/catchAsync')

const User = require('./models/user');
const Template = require('./models/template');
const { verifyToken } = require('./middleware');


mongoose.connect('mongodb://localhost:27017/tcGenDb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected")
});

const app = express();


app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret',
    resave: false,
    saveUninitialized: true,
    // store: new mongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 *60 * 24 * 7,
        maxAge: 1000 * 60 *60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(cookieParser());
// app.use(flash());

app.use((req, res, next) => {
    console.log(req.session)
   res.locals.currentUser = req.session.user_id;
//    res.locals.success = req.flash('success');
//    res.locals.error = req.flash('error');
   res.locals.session = req.session
   next();
})

const tcs = ['T&C', 'PP']

app.get('/', (req, res) => {
   console.log(req.session)
    if(req.session.user_id){
        console.log('Up and running')
    } else console.log('Not Working') 
    res.render('landing.ejs', {session})
    
})


app.post('/welcome', verifyToken, async(req, res) => {
    return res.status(200).send('Welcome dude')
})

//AUTHENTICATION

app.get('/register', async(req, res) => {
    res.render('register.ejs')
})

app.post('/register',  (async(req, res, next) => {

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

    res.status(201).json(user);

   
} catch (err) {
  console.log(err);
}
    
}))



app.get('/login', async(req, res) => {
    res.render('login')
})



app.post('/login', async(req, res, next) => {
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
})

app.get('/logout', async(req, res) => {
    req.session.destroy();
    res.redirect('/')
})

//Templates
app.get('/newtc', catchAsync(async(req, res, next) => {
    res.render('new', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

app.post('/index', catchAsync(async(req, res, next) => {
    const { tc, company_name, company_website, country, policyEffeciveDate, address, phone, email, industry, privacy, gdrp, ads } = req.body

    const template = await Template.create({
        tc: 'T&C',
        company_name,
        company_website,
        country,
        policyEffeciveDate,
        address,
        phone,
        email: email.toLowerCase(),
        industry,
        privacy: req.body.privacy ? true: false,
        gdrp: req.body.gdrp ? true: false,
        ads: req.body.ads ? true: false,
        author: req.session.user_id
    })
    console.log(tc)
    res.send(template)
}))

app.get('/newpp', catchAsync(async(req, res, next) => {
    res.render('newpp', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

app.post('/indexx', catchAsync(async(req, res, next) => {
    const { tc, company_name, company_website, country, policyEffeciveDate, address, phone, email, industry, privacy, gdrp, ads } = req.body

    const template = await Template.create({
        tc: 'PP',
        company_name,
        company_website,
        country,
        policyEffeciveDate,
        address,
        phone,
        email: email.toLowerCase(),
        industry,
        privacy: req.body.privacy ? true: false,
        gdrp: req.body.gdrp ? true: false,
        ads: req.body.ads ? true: false,
        author: req.session.user_id
    })
    console.log(tc)
    res.send(template)
}))

app.get('/myTemplates', catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('templates', { templates })
}))

app.get('/ppTemplates', catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('pp_template', { templates })
}))

app.get('/tcTemplates', catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('tc_template', { templates })
}))

app.get('/myTemplates/:id', catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findById(id)
    console.log(template)
    res.render('template', { template})
}))

app.get('/dashboard/:id', async(req, res) => {
    const { id } = req.params 
    const user = await User.findById(id)
    console.log(user)
    res.render('dashboard.ejs', { user })
})

app.listen(3000, () => {
    console.log('Serving on port 3000')
})