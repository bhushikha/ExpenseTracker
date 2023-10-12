// const User = require('../models/users');
// const Forgotpassword = require('../models/forgotpassword');
// const bcrypt = require('bcrypt');
// const uuid = require('uuid')
// const sgMail = require('@sendgrid/mail');

// exports.getForgotpassword = async (req, res, next) => {
//     try {
//         const { email } = req.body;
//         const user = await User.findOne({ where: { email } });
//         if (user) {
//             const id = uuid.v4();
//             user.createForgotpassword({ id, active: true })
//                 .catch(err => {
//                     throw new Error(err)
//                 })



//             sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//             const msg = {
//                 to: email,
//                 from: 'deepak545608@gmail.com',
//                 subject: 'Sending with SendGrid is Fun',
//                 text: 'and easy to do anywhere, even with Node.js',
//                 html: `<h1>http://13.53.122.200:3000/password/resetpassword/${id}</h1>`,
//             }

//             sgMail
//                 .send(msg)
//                 .then((response) => {

//                     // console.log('email sent successfully >>>>email')
//                     return res.status(response[0].statusCode).json({ message: 'Link to reset password sent to your mail ', sucess: true })
//                 }).catch(error => {
//                     throw new Error(error)
//                 })
//         } else {
//             throw new Error('User doesnot exist')
//         }

//     } catch (err) {
//         console.error(err)
//         return res.json({ message: err, success: false });
//     }


// }

const User = require('../models/users');
const Forgotpassword = require('../models/forgotpassword');
const bcrypt = require('bcrypt');
const uuid = require('uuid');
const SibApiV3Sdk = require('sib-api-v3-sdk');

exports.getForgotpassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user) {
            const id = uuid.v4();
            user.createForgotpassword({ id, active: true })
                .catch(err => {
                    throw new Error(err);
                });

            // Initialize SendinBlue API client
            const sendinBlue = new SibApiV3Sdk.TransactionalEmailsApi();

            // Compose the email
            const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail({
                to: [{ email: email }],
                subject: 'Sending with SendinBlue is Fun',
                textContent: 'and easy to do anywhere, even with Node.js',
                htmlContent: `<h1>http://13.53.122.200:3000/password/resetpassword/${id}</h1>`
            });
            sendSmtpEmail.apiKey = process.env.SENDINBLUE_API_KEY;

            // Send the email
            await sendinBlue.sendTransacEmail(sendSmtpEmail);

            return res.status(200).json({ message: 'Link to reset password sent to your mail', success: true });
        } else {
            throw new Error('User does not exist');
        }
    } catch (err) {
        console.error(err);
        return res.json({ message: err.message, success: false });
    }
};








exports.getResetpassword = async (req, res) => {
    const id = req.params.id;
    Forgotpassword.findOne({ where: { id } }).then(forgotpasswordrequest => {
        if (forgotpasswordrequest) {
            forgotpasswordrequest.update({ active: false });
            res.status(200).send(`<html>
                                    <script>
                                        function formsubmitted(e){
                                            e.preventDefault();
                                            console.log('called')
                                        }
                                    </script>
                                    <form action="/password/updatepassword/${id}" method="get">
                                        <label for="newpassword">Enter New password</label>
                                        <input name="newpassword" type="password" required></input>
                                        <button>reset password</button>
                                    </form>
                                </html>`
            )
            res.end()

        }
    })
}
exports.getUpdatepassword = async (req, res) => {
    try {
        const newpassword = req.query;
        const resetpasswordid = req.params;
        Forgotpassword.findOne({ where: { id: resetpasswordid } }).then(resetpasswordrequest => {
            User.findOne({ where: { id: resetpasswordrequest.userId } }).then(user => {
                // console.log('userDetails', user)
                if (user) {
                    //encrypt the password

                    const saltRounds = 10;
                    bcrypt.genSalt(saltRounds, function (err, salt) {
                        if (err) {
                            console.log(err);
                            throw new Error(err);
                        }
                        bcrypt.hash(newpassword, salt, function (err, hash) {
                            // Store hash in DB
                            if (err) {
                                console.log(err);
                                throw new Error(err);
                            }
                            user.update({ password: hash }).then(() => {
                                res.status(201).json({ message: 'Successfuly update the new password' })
                            })
                        });
                    });
                } else {
                    return res.status(404).json({ error: 'No user Exists', success: false })
                }
            })
        })
    } catch (error) {
        return res.status(500).json({ error, success: false })
    }

}