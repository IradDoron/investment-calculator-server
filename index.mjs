import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import pkg from 'python-shell';

const { PythonShell } = pkg;

config();

const app = express();

app.use(express.json());

const corsOptions = {
	origin: '*',
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	allowedHeaders: ['Content-Type', 'Authorization'],
};

const corsMiddleware = cors(corsOptions);

app.use(corsMiddleware);

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.get('/', (req, res) => {
	res.end('Hello World!');
});

app.get('/page1', (req, res) => {
	res.end('Hello World from page 1!');
});

// create a dummy post test
// app.post('/test', (req, res) => {
// 	const { body } = req;
// 	const { name } = body;

// 	res.end(`Hello ${name}!`);
// });

// to get the response from the test:

/*

app.post('/calc', (req, res) => {
	const { body } = req;
	const {
		timeOfInvestment,
		stockTicket,
		initialInvestment,
		monthlyContribution,
	} = body;

	const options = {
		args: [
			timeOfInvestment,
			stockTicket,
			initialInvestment,
			monthlyContribution,
		],
	};

	const resObject = {
		timeOfInvestment,
		stockTicket,
		initialInvestment,
		monthlyContribution,
	};

	const resJson = JSON.stringify(resObject);

	res.end(resJson);

	// PythonShell.run('calc.py', options, (err, res) => {
	// 	if (err) {
	// 		console.log(err);
	// 	}

	// 	let formattedResObject = '';
	// 	res.forEach((item) => {
	// 		formattedResObject += item;
	// 		formattedResObject += '\n';
	// 	});

	// 	const jsonsList = formattedResObject.split('&*&');

	// 	const parsedJsonsList = jsonsList.map((item) => JSON.parse(item));

	// 	const graphDict = parsedJsonsList[0];
	// 	const divGraphDict = parsedJsonsList[1];
	// 	const divYearYield = parsedJsonsList[2];

	// 	const formattedResoultObject = {
	// 		graphDict,
	// 		divGraphDict,
	// 		divYearYield,
	// 	};

	// 	const stringifyedResoultObject = JSON.stringify(formattedResoultObject);

	// 	response.setHeader('Access-Control-Allow-Origin', '*');
	// 	response.setHeader('Access-Control-Allow-Credentials', 'true');
	// 	response.setHeader(
	// 		'Access-Control-Allow-Methods',
	// 		'GET,HEAD,OPTIONS,POST,PUT'
	// 	);
	// 	response.setHeader(
	// 		'Access-Control-Allow-Headers',
	// 		'Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers'
	// 	);

	// 	response.setHeader(
	// 		'Access-Control-Allow-Headers',
	// 		'Content-Type, Authorization'
	// 	);

	// 	response.send(stringifyedResoultObject);

	// 	// const formattedResObject = {
	// 	// 	value_of_today: res[0],
	// 	// 	total_contribution: res[1],
	// 	// 	cumulative_interest: res[2],
	// 	// 	average_annual_interest_of_final_value: res[3],
	// 	// 	average_annual_interest_of_ticket: res[4],
	// 	// };

	// 	// 		const formattedResoultString = `
	// 	// Final value of today: ${formattedResObject.value_of_today}
	// 	// total contribution: ${formattedResObject.total_contribution}
	// 	// Cumulative interest of ${formattedResObject.cumulative_interest}%
	// 	// Average annual interest of final value: ${formattedResObject.average_annual_interest_of_final_value}%
	// 	// Average annual interest of ticket: ${formattedResObject.average_annual_interest_of_ticket}%
	// 	//         `;

	// 	// console.log(formattedResoultString);
	// });
});

*/

app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}...`);
});
