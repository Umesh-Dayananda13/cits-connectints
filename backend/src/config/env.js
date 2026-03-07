import dotenv from 'dotenv'

dotenv.config()

const config = {
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
}

export default config
