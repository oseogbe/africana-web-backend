import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER || '',
        pass: process.env.MAILTRAP_PASS || '',
    },
})

export const sendConfirmationEmail = async (to: string, confirmationLink: string): Promise<void> => {
    await transporter.sendMail({
        from: 'noreply@shopafricana.co',
        to,
        subject: 'Confirm Your Email Address',
        html: `
          <b>Thank you for choosing Africana!</b>
          <br />
          <p>To complete registration, please click the following link to confirm your email address:</p>
          <a href="${confirmationLink}" target="_blank">Confirm Email</a>
          <br /><br />
          <p>Africana<p>
        `,
    })
}

export const sendLoginDetailsEmail = async (to: string, password: string, loginUrl: string): Promise<void> => {
    await transporter.sendMail({
        from: 'noreply@shopafricana.co',
        to,
        subject: 'Your Login Details',
        html: `
          <b>Welcome to Africana!</b>
          <br />
          <p>Your login details are as follows:</p>
          <p>Email: ${to}</p>
          <p>Password: ${password}</p>
          <p>Login URL: <a href="${loginUrl}" target="_blank">${loginUrl}</a></p>
          <p>Endeavour to reset your password in your profile area.</p>
          <br />
          <p>Africana<p>
        `,
    })
}