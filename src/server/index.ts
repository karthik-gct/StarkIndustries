import express from 'express'
import { createApp } from './app.js'

const PORT = parseInt(process.env.PORT ?? '3100')
const app = createApp()

app.listen(PORT, () => {
  console.log(`StarkIndustries settings server running on http://localhost:${PORT}`)
})
