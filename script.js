async function loadOrders() {
    const response = await fetch('orders.json');
    const orders = await response.json();

    const ordersContainer = document.getElementById('orders');
    const profitSummaryContainer = document.getElementById('profit-summary');
    const monthlySummaryContainer = document.getElementById('monthly-summary');
    const lastPurchaseContainer = document.getElementById('last-purchase');
    const summaryTotalsContainer = document.getElementById('summary-totals');

    ordersContainer.innerHTML = '';
    profitSummaryContainer.innerHTML = '';
    monthlySummaryContainer.innerHTML = '';
    lastPurchaseContainer.innerHTML = '';
    summaryTotalsContainer.innerHTML = '';

    orders.sort((a, b) => new Date(b.BuyDate) - new Date(a.BuyDate));

    // Calculate top-level summaries
    let totalGrossProfit = 0;
    let totalTransactions = orders.length;
    let totalFilledValue = 0;
    let openOrdersValue = 0;

    const weeklyProfits = {};
    const weeklyTransactions = {};

    // Initialize variables for monthly summaries
    const monthlyTransactions = Array(12).fill(0);
    const monthlyFilledValue = Array(12).fill(0);
    const monthlyGrossProfit = Array(12).fill(0);

    orders.forEach(order => {
        const buyDate = new Date(order.BuyDate);
        const orderMonth = buyDate.getMonth();
        const weekNumber = getWeekNumber(buyDate);

        // Update monthly transactions and filled values
        monthlyTransactions[orderMonth]++;
        monthlyFilledValue[orderMonth] += order.FilledValue;

        totalFilledValue += order.FilledValue;

        if (order.SaleDate === null) {
            openOrdersValue += order.FilledValue;
        }

        if (order.GrossProfit !== null) {
            totalGrossProfit += order.GrossProfit;

            // Update monthly gross profit
            monthlyGrossProfit[orderMonth] += order.GrossProfit;

            weeklyProfits[weekNumber] = (weeklyProfits[weekNumber] || 0) + order.GrossProfit;
        }

        weeklyTransactions[weekNumber] = (weeklyTransactions[weekNumber] || 0) + 1;
    });

    const numberOfWeeks = Object.keys(weeklyProfits).length;
    const averageProfitPerWeek = numberOfWeeks > 0 ? totalGrossProfit / numberOfWeeks : 0;
    const averageTransactionsPerWeek = numberOfWeeks > 0 ? totalTransactions / numberOfWeeks : 0;

    // Calculate Gross Profit Percentage
    let grossProfitPercentage = 0;
    if (totalFilledValue > 0) {
        grossProfitPercentage = (totalGrossProfit / totalFilledValue) * 100;
    }

    // Display top-level summaries
    summaryTotalsContainer.innerHTML = `
        <h3>Summary Totals</h3>
        <p><strong>Total Gross Profit:</strong> $${totalGrossProfit.toFixed(2)}</p>
        <p><strong>Average Profit Per Week:</strong> $${averageProfitPerWeek.toFixed(2)}</p>
        <p><strong>Average Transactions Per Week:</strong> ${averageTransactionsPerWeek.toFixed(2)}</p>
        <p><strong>Total Filled Value:</strong> $${totalFilledValue.toFixed(2)}</p>
        <p><strong>Open Orders Value:</strong> $${openOrdersValue.toFixed(2)}</p>
        <hr>
    `;

    // Determine decimal places based on screen width
    const isMobile = window.innerWidth <= 600;
    const decimalPlaces = isMobile ? 1 : 4;

    // Profit Summary
    profitSummaryContainer.innerHTML = `
        <h3>Profit Summary</h3>
        <p><strong>Total Filled Value:</strong> $${totalFilledValue.toFixed(decimalPlaces)}</p>
        <p><strong>Total Gross Profit:</strong> $${totalGrossProfit.toFixed(decimalPlaces)}</p>
        <p><strong>Gross Profit Percentage:</strong> ${grossProfitPercentage.toFixed(2)}%</p>
        <hr>
    `;

    // Monthly Summary Table
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let monthlySummaryTable = `
        <h3>Monthly Summary</h3>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Txns</th>
                    <th>Filled Value</th>
                    <th>Gross Profit</th>
                </tr>
            </thead>
            <tbody>
                ${months.map((month, index) => `
                    <tr>
                        <td>${month}</td>
                        <td>${monthlyTransactions[index]}</td>
                        <td>$${monthlyFilledValue[index].toFixed(decimalPlaces)}</td>
                        <td>$${monthlyGrossProfit[index].toFixed(decimalPlaces)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    monthlySummaryContainer.innerHTML = monthlySummaryTable;

    // Transactions Details (no change)
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order');

        orderElement.innerHTML = `
            <p><strong>Order ID:</strong> ${order.Id}</p>
            <p><strong>Buy Date:</strong> ${order.BuyDate.split('T')[0]}</p>
            <p><strong>Sale Date:</strong> ${order.SaleDate ? order.SaleDate.split('T')[0] : 'Open'}</p>
            <p><strong>Filled Value:</strong> $${order.FilledValue.toFixed(decimalPlaces)}</p>
            <p><strong>Days Between Buy and Sale:</strong> ${order.DaysBetweenCreateAndSale !== null ? order.DaysBetweenCreateAndSale : 'N/A'}</p>
            <p><strong>Purchase Price:</strong> $${order.PurchasePrice.toFixed(decimalPlaces)}</p>
            <p><strong>Actual Sale Price:</strong> ${order.ActualSalePrice !== null ? `$${order.ActualSalePrice.toFixed(decimalPlaces)}` : 'N/A'}</p>
            <p><strong>Targeted Profit (%):</strong> ${order.TargetedProfitPerc !== null ? `${order.TargetedProfitPerc.toFixed(2)}%` : 'N/A'}</p>
            <p><strong>Profit Flag:</strong> ${order.ProfitFlag}</p>
            <p><strong>Gross Profit:</strong> ${order.GrossProfit !== null ? `$${order.GrossProfit.toFixed(decimalPlaces)}` : 'N/A'}</p>
        `;
        ordersContainer.appendChild(orderElement);
    });

    // Update the last purchase date
    if (orders.length > 0) {
        const lastPurchaseDate = orders[0].BuyDate.split('T')[0];
        lastPurchaseContainer.innerHTML = `<strong>Date of Last Purchase:</strong> ${lastPurchaseDate}`;
    }
}
