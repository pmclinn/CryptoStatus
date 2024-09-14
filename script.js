async function loadOrders() {
    const response = await fetch('orders.json');
    const orders = await response.json();

    const ordersContainer = document.getElementById('orders');
    const grossSubtotalsContainer = document.getElementById('gross-subtotals');
    const monthlySummaryContainer = document.getElementById('monthly-summary');
    const lastPurchaseContainer = document.getElementById('last-purchase');
    const summaryTotalsContainer = document.getElementById('summary-totals');

    ordersContainer.innerHTML = '';
    grossSubtotalsContainer.innerHTML = '';
    monthlySummaryContainer.innerHTML = '';
    lastPurchaseContainer.innerHTML = '';
    summaryTotalsContainer.innerHTML = '';

    orders.sort((a, b) => new Date(b.BuyDate) - new Date(a.BuyDate));

    // Calculate top-level summaries
    let totalGrossProfit = 0;
    let totalTransactions = orders.length;
    let totalFilledValue = 0;
    let openOrdersValue = 0;
    let totalProfitOrders = 0;

    const weeklyProfits = {};
    const weeklyTransactions = {};

    orders.forEach(order => {
        const buyDate = new Date(order.BuyDate);
        const weekNumber = getWeekNumber(buyDate);

        if (order.GrossProfit !== null) {
            totalGrossProfit += order.GrossProfit;
            totalProfitOrders++;
            weeklyProfits[weekNumber] = (weeklyProfits[weekNumber] || 0) + order.GrossProfit;
        }

        weeklyTransactions[weekNumber] = (weeklyTransactions[weekNumber] || 0) + 1;
        totalFilledValue += order.FilledValue;

        if (order.SaleDate === null) {
            openOrdersValue += order.FilledValue;
        }
    });

    const numberOfWeeks = Object.keys(weeklyProfits).length;
    const averageProfitPerWeek = numberOfWeeks > 0 ? totalGrossProfit / numberOfWeeks : 0;
    const averageTransactionsPerWeek = numberOfWeeks > 0 ? totalTransactions / numberOfWeeks : 0;

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

    // Existing gross subtotals and monthly summary code...
    // You can adjust or remove the gross subtotals if they are now part of the summary totals

    // Determine decimal places based on screen width
    const isMobile = window.innerWidth <= 600;
    const decimalPlaces = isMobile ? 1 : 4;

    // Transactions Details
    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.classList.add('order');

        orderElement.innerHTML = `
            <p><strong>Order ID:</strong> ${order.Id}</p>
            <p><strong>Buy Date:</strong> ${order.BuyDate}</p>
            <p><strong>Sale Date:</strong> ${order.SaleDate ? order.SaleDate : 'Open'}</p>
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
}

// Helper function to get week number of the year
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
}

window.addEventListener('resize', loadOrders); // Re-run the function if the window is resized
loadOrders(); // Initial load
