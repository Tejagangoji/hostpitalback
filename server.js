const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { User } = require('./model/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
//to receive json data
app.use(express.json());
//initialize cors which avails any origin
app.use(cors({
    origin: '*'
}));

mongoose.connect('mongodb+srv://hospital:hospital@cluster0.jvck8hg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0').then(
    console.log("db is connected")
);

app.get('/', async (req, res) => {
    return res.json("home")
})


//register
app.post("/register", async (req, res) => {
    let { name, email, password } = req.body;
    //check the user already exist with this username
    const takenUsername = await User.findOne({ email: email });
    if (takenUsername) {
        return res.status(405).json({ message: "email already exists" });
    } else {
        password = await bcrypt.hash(req.body.password, 10);
        const dbUser = new User({
            name,
            email,
            password,
        });
        await dbUser.save();
        return res.status(200).json({ message: "user account created sucessfully" });
    }
});

//login user
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const userexist = await User.findOne({ email: email });
        if (!userexist) {
            return res.status(404).json('user not found');
        }
        //check the hashed password is correct or not
        bcrypt.compare(password, userexist.password).then((isCorrect) => {
            if (isCorrect) {
                //take user's id to find that user in db. taking id of the record is better
                let payload = {
                    user: {
                        id: userexist.id
                    }
                }
                //encoding user's id wiht "newsecreate" string and we decode it wiht same string.
                jwt.sign(payload, 'newsecreate', { expiresIn: 36000000 }, (err, token) => {
                    if (err) throw err;
                    //jwt token generated and send it to responce. 
                    return res.status(200).json({ token: token });
                });
            }
            else {
                return res.status(405).json('password is incorrect');
            }
        }
        );
    } catch (error) {
        return res.status(500).json("server error")
    }
});

app.post('/adminlogin', async (req, res) => {
    const adminemail = "admin@gmail.com", adminpassword = "Admin123";
    const { email, password } = req.body;
    if (adminemail === email && password === adminpassword) {
        let payload = {
            user: {
                id: adminemail
            }
        }
        jwt.sign(payload, 'newsecreate', { expiresIn: 36000000 }, (err, token) => {
            if (err) throw err;
            //jwt token generated and send it to responce. 
            return res.status(200).json({ token: token });
        });
    }
    else {
        return res.status(405).json('email/password is incorrect');
    }
})

app.listen(5000, () => console.log("server is running"));