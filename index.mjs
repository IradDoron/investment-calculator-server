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

app.post('/name', (req, res) => {
	const { body } = req;
	const { name } = body;

	res.end(`Hello ${name}!`);
});

app.post('/add', (req, res) => {
	const { body } = req;
	const { a, b } = body;

	const sum = a + b;

	res.end(`${sum}`);
});

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

	PythonShell.run('calc.py', options, (err, response) => {
		if (err) {
			console.log(err);
		}

		let formattedResObject = '';
		response.forEach((item) => {
			formattedResObject += item;
			formattedResObject += '\n';
		});

		const jsonsList = formattedResObject.split('&*&');

		const parsedJsonsList = jsonsList.map((item) => JSON.parse(item));

		const graphDict = parsedJsonsList[0];
		const divGraphDict = parsedJsonsList[1];
		const divYearYield = parsedJsonsList[2];

		const formattedResoultObject = {
			graphDict,
			divGraphDict,
			divYearYield,
		};

		const stringifyedResoultObject = JSON.stringify(formattedResoultObject);

		res.send(stringifyedResoultObject);

		// const formattedResObject = {
		// 	value_of_today: res[0],
		// 	total_contribution: res[1],
		// 	cumulative_interest: res[2],
		// 	average_annual_interest_of_final_value: res[3],
		// 	average_annual_interest_of_ticket: res[4],
		// };

		// 		const formattedResoultString = `
		// Final value of today: ${formattedResObject.value_of_today}
		// total contribution: ${formattedResObject.total_contribution}
		// Cumulative interest of ${formattedResObject.cumulative_interest}%
		// Average annual interest of final value: ${formattedResObject.average_annual_interest_of_final_value}%
		// Average annual interest of ticket: ${formattedResObject.average_annual_interest_of_ticket}%
		//         `;

		// console.log(formattedResoultString);
	});
});

app.post('/calc-dummy', (req, res) => {
	const { body } = req;
	const {
		timeOfInvestment,
		stockTicket,
		initialInvestment,
		monthlyContribution,
	} = body;

	let formattedRes = `
		timeOfInvestment: ${timeOfInvestment}
		stockTicket: ${stockTicket}
		initialInvestment: ${initialInvestment}
		monthlyContribution: ${monthlyContribution}
	`;

	res.end(formattedRes);
});

app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}...`);
});
