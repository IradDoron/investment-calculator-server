from yahoo_fin.stock_info import get_data
import datetime
import sys


def find_next_month_ind(days_list):
    for day_ind, day in enumerate(days_list):
        if day.month != days_list[0].month:
            return day_ind
    return -1


def value_cal(years_ago, ticket, start_invest, monthly_contribution):
    df = get_data(ticket, start_date=str((datetime.datetime.now() - datetime.timedelta(days=years_ago*365)).date()),
                  end_date=None, interval="1d")
    day_of_invest_list = []
    ind = 0
    days_list = df.index.tolist()
    while ind < len(days_list)-1:
        if days_list[ind].day < 10:
            ind += 1
            continue
        if days_list[ind].day >= 10:
            day_of_invest_list.append(ind)
            next_month_ind = find_next_month_ind(days_list[ind:ind+24])
            if next_month_ind == -1:
                break
            else:
                ind += next_month_ind
    df_of_price = df.iloc[day_of_invest_list]['close']
    total_contribution = start_invest
    cnt_of_share = start_invest/df_of_price[0]
    for price in df_of_price:
        cnt_of_share += monthly_contribution/price
        total_contribution += monthly_contribution

    value_of_today = df_of_price[-1] * cnt_of_share

    a, b, c, d, e = value_of_today, total_contribution, value_of_today*100/total_contribution, ((
        value_of_today/total_contribution)**(1/years_ago)-1)*100, ((df_of_price[-1]/df_of_price[0])**(1/years_ago)-1)*100

    s = ''

    for el in [a, b, c, d, e]:
        s += str(el)+'\n'

    print(s)


if __name__ == '__main__':

    value_cal(years_ago=float(sys.argv[1]), ticket=sys.argv[2],
              start_invest=float(sys.argv[3]), monthly_contribution=float(sys.argv[4]))
