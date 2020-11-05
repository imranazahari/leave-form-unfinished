const mysql= require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const db= mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.leaveform = async (req, res) => {
    try{ 
        const {name, email, Date, subject, message } = req.body;

       if(!email || !name || !Date || !subject || !message ){
           return res.status(400).render('leaveform', {
               message: 'Please fill in the blanks'
           })
       }
       db.query('SELECT * FROM users WHERE email = ?', [email], async(error, results) => {
           console.log(results);
           if (!results){
               return res.render ('leaveform', {
                   message: 'Incorrect name or email'
               })
           }
           res.status(200).redirect("/");
       });
    } catch(error){
        console.log(error)
        }
}

exports.login = async (req, res) => {
    try{ 
       const {email, password} = req.body;
       if(!email || !password){
           return res.status(400).render('login', {
               message: 'Please provide email or password'
           })
       }

       db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
           console.log(results);
           if(!email || !(await bcrypt.compare(password, results[0].password))) {
               return res.status(401).render('login', {
                   message: 'Incorrect email or password'
               })
           }else{
               const id = results[0].id;

               const token = jwt.sign ({id}, process.env.JWT_SECRET, {
                   expiresIn: process.env.JWT_EXPIRES_IN
               });

               console.log("The token is" + token)

               const cookieOptions = {
                   expires: new Date(
                       Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                   ),
                   httpOnly: true
               }
               res.cookie('jwt', token, cookieOptions);
               res.status(200).redirect("/");

           }
       })

    } catch(error){
        console.log(error)
    }
}

exports.register = (req, res) => {
    console.log(req.body);

   const {name, email, password, passwordComfirm} = req.body;

   db.query('SELECT email FROM users WHERE email = ?', [email], async (error, results) => {
       if(error){
           console.log(error);
       }

       if(results.length > 0) {
           return res.render ('register',  {
               message:'That email is used'
           })
       }else if ( password !== passwordComfirm ) {
           return res.render ('register',  {
            message:'Password do not match'
            });
        }

       let hashedpassword = await bcrypt.hash(password, 8);
       console.log(hashedpassword);

       db.query('INSERT INTO users SET ?', {name: name, email: email, password: hashedpassword}, (error, results)=>{
       if(error){
           console.log(error);
       } else{
          return res.render ('register',  {
            message:'User Registered'
            });
       }
       })

        })

}