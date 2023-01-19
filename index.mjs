import axios from 'axios';
import cors from 'cors';
import { config } from 'dotenv';
import express from 'express';
import pkg from 'python-shell';

const { PythonShell } = pkg;

config();

const app = express();

app.use(cors());

app.use(express.json());

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

app.get('/', (req, result) => {
	result.end;
});

app.post('/', (req, result) => {
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

	PythonShell.run('main.py', options, (err, res) => {
		if (err) {
			console.log(err);
		}

		const formattedResObject = {
			value_of_today: res[0],
			total_contribution: res[1],
			cumulative_interest: res[2],
			average_annual_interest_of_final_value: res[3],
			average_annual_interest_of_ticket: res[4],
		};

		const formattedResoultString = `
Final value of today: ${formattedResObject.value_of_today}
total contribution: ${formattedResObject.total_contribution}
Cumulative interest of ${formattedResObject.cumulative_interest}%
Average annual interest of final value: ${formattedResObject.average_annual_interest_of_final_value}%
Average annual interest of ticket: ${formattedResObject.average_annual_interest_of_ticket}%
        `;

		console.log(formattedResoultString);

		result.send(JSON.stringify(formattedResoultString));
	});
});

app.listen(PORT, HOST, () => {
	console.log(`Server running at http://${HOST}:${PORT}...`);
});
