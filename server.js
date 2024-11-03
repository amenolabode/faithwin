const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Setup winston logger
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
	return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.colorize(),
		logFormat,
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({
			filename: 'logs/server.log',
			level: 'info',
		}),
		new winston.transports.File({
			filename: 'logs/error.log',
			level: 'error',
		}),
	],
	exceptionHandlers: [
		new winston.transports.File({ filename: 'logs/exceptions.log' }),
	],
});

// If in development, also log to the console in verbose mode
if (process.env.NODE_ENV === 'development') {
	logger.add(
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
			),
		}),
	);
}

// Helper function for consistent API responses
const apiResponse = (res, status, message, data = null) => {
	return res.status(status).json({ status, message, data });
};

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => logger.info('Connected to MongoDB'))
	.catch((err) => logger.error('Error connecting to MongoDB:', err));

// Define Booking Schema
const bookingSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true },
	service: { type: String, required: true },
	date: { type: Date, required: true },
});

const Booking = mongoose.model('Booking', bookingSchema);

// API Routes
app.post('/api/bookings', async (req, res) => {
	try {
		const newBooking = new Booking(req.body);
		await newBooking.save();
		logger.info('Booking created:', newBooking);
		return apiResponse(
			res,
			201,
			'Booking created successfully',
			newBooking,
		);
	} catch (error) {
		logger.error('Error creating booking:', error);
		return apiResponse(res, 400, 'Error creating booking', error.message);
	}
});

app.get('/api/bookings', async (req, res) => {
	try {
		const bookings = await Booking.find();
		return apiResponse(
			res,
			200,
			'Bookings retrieved successfully',
			bookings,
		);
	} catch (error) {
		logger.error('Error retrieving bookings:', error);
		return apiResponse(
			res,
			500,
			'Error retrieving bookings',
			error.message,
		);
	}
});

// Start server
app.listen(port, () => {
	logger.info(`Server is running on port ${port}`);
});
