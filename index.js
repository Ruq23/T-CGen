if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const mongoose = require ('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const session = require('cookie-session')
const flash = require('connect-flash');
const port = process.env.PORT || 3000;


const dotenv = require("dotenv").config();
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser");
const mongoSanitize = require('express-mongo-sanitize');


const ExpressError = require('./utilities/ExpressError')
const catchAsync = require('./utilities/catchAsync')

const User = require('./models/user');
const Template = require('./models/template');
const { verifyToken, isLoggedIn } = require('./middleware');


// mongoose.connect('mongodb://localhost:27017/tcGenDb', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

// mongoose.connect('mongodb://mongo:acH0a8Ko3FjvQWEDu345@containers-us-west-54.railway.app:7190', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

mongoose.connect(process.env.MONGODB_CONNECT_URI), {
    useNewUrlParser: true,
    useUnifiedTopology: true
}

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
app.use(flash());

app.use(mongoSanitize({
    replaceWith: '_'
}))

app.use((req, res, next) => {
    console.log(req.session)
   res.locals.currentUser = req.session.user_id;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
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

app.post('/register',  (catchAsync( async(req, res, next) => {

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



app.get('/login', async(req, res) => {
    res.render('login')
})



app.post('/login', catchAsync( async(req, res, next) => {
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

app.get('/logout', catchAsync( async(req, res) => {
    req.session.destroy();
    res.redirect('/')
}))

//Templates
app.get('/newtc', isLoggedIn, catchAsync(async(req, res, next) => {
    res.render('newtc', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

app.post('/index', isLoggedIn, catchAsync(async(req, res, next) => {
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
    res.redirect(`myTemplates/${template._id}`)
}))

app.get('/newpp', isLoggedIn, catchAsync(async(req, res, next) => {
    res.render('newpp', {tcs})
    console.log(req.session.user_id)
    console.log(req.session)

}))

app.post('/indexx', isLoggedIn, catchAsync(async(req, res, next) => {
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
    res.redirect(`myTemplates/${template._id}`)
}))

app.get('/myTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('templates', { templates })
}))

app.get('/ppTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('pp_template', { templates })
}))

app.get('/tcTemplates', isLoggedIn, catchAsync(async(req, res, next) => {
    const templates = await Template.find({ author: req.session.user_id })
    console.log(templates)
    console.log(req.session.user_id)
    res.render('tc_template', { templates })
}))

app.get('/myTemplates/:id', isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findById(id)
    console.log(template)
    res.render('show', { template})
}))

app.delete('/myTemplates/:id', isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const deleteTemplate = await Template.findByIdAndDelete(id)
    res.redirect('/myTemplates')
}))

app.get('/myTemplates/:id/edit',isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findById(id)
    console.log(template)
    res.render('edit', { template})
}))

app.put('/myTemplates/:id',isLoggedIn, catchAsync(async(req, res) => {
    const { id } = req.params
    const template = await Template.findByIdAndUpdate(id, req.body)
    res.redirect(`/myTemplates/${template._id}`)

}))


app.get('/dashboard/:id',isLoggedIn, catchAsync( async(req, res) => {
    const { id } = req.params 
    const user = await User.findById(id)
    console.log(user)
    res.render('dashboard.ejs', { user })
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
} )

app.use((err, req, res, next) => {
    const{statusCode = 500} = err
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error.ejs', { err });
    // res.status(statusCode).send('Error')
})


const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log('Serving on port ' + PORT )
})