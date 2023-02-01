export const pricesDict = (quotes, dividends, monthlyContribution) => {
	const dictOfClosePricesOnDividendDates = {};
	let dividendIndex = 0;
	let currMonth = quotes[0].date.getMonth();
	let stockCntr = 0;
	let contCntr = 0;
	const stockPrices = [];

	if (dividends.length === 0) {
		quotes.forEach((element, index) => {
			const { date, close } = element;

			if (date.getMonth() !== currMonth || index === 0) {
				stockCntr += monthlyContribution / close;
				contCntr += monthlyContribution;
				stockPrices.push({
					date,
					value: stockCntr * close,
					contribution: contCntr,
					stockCnt: stockCntr,
				});

				currMonth = date.getMonth();
			}
		});

		stockPrices.forEach((_, index, arr) => {
			arr[index].nextDate = arr[index + 1]?.date;
		});

		return { dictOfClosePricesOnDividendDates, stockPrices };
	} else {
		for (let i = 0; i < quotes.length; i++) {
			const { date, close } = quotes[i];

			const { date: dividendDate } = dividends[dividendIndex];

			if (date.getMonth() !== currMonth || i === 0) {
				stockCntr += monthlyContribution / close;
				contCntr += monthlyContribution;
				stockPrices.push({
					date,
					value: stockCntr * close,
					contribution: contCntr,
					stockCnt: stockCntr,
				});

				currMonth = date.getMonth();
			}

			if (date.getTime() === dividendDate.getTime()) {
				dictOfClosePricesOnDividendDates[date.getTime()] = close;
				if (dividendIndex === dividends.length - 1) {
					break;
				} else {
					dividendIndex++;
				}
			}
		}

		stockPrices.forEach((_, index, arr) => {
			arr[index].nextDate = arr[index + 1]?.date;
		});

		return { dictOfClosePricesOnDividendDates, stockPrices };
	}
};
