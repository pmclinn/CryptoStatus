async function loadOrders() {
    try {
        const response = await fetch('orders.json');
        const orders = await response.json();

        const ordersContainer = document.getElementById('orders');
        const profitSummaryContainer = document.getElementById('profit-summary');
        const monthlySummaryContainer = document.getElementById('monthly-summary');
        const lastPurchaseContainer = document.getElementById('last-purchase');
        const activitySummaryContainer = document.getElementById('activity-summary');

        ordersContainer.innerHTML = '';
        profitSummaryContainer.innerHTML = '';
        monthlySummaryContainer.innerHTML = '';
        lastPurchaseContainer.innerHTML = '';
        activitySummaryContainer.innerHTML = '';

        // Ensure IDs are integers and parse dates and numbers
        orders.forEach(order => {
            order.Id = parseInt(order.Id, 10);
            order.BuyDate = new Date(order.BuyDate);
            if (order.SaleDate) {
                order.SaleDate = new Date(order.SaleDate);
            }
            order.ProfitMinusFees = order.ProfitMinusFees !== null ? parseFloat(order.ProfitMinusFees) : null;
            order.FilledValue = parseFloat(order.FilledValue);
            order.PurchasePrice = parseFloat(order.PurchasePrice);
            order.ActualSalePrice = order.ActualSalePrice !== null ? parseFloat(order.ActualSalePrice) : null;
            order.TargetedProfitPerc = parseFloat(order.TargetedProfitPerc);
        });

        // Sort orders by Id in descending order
        orders.sort((a, b) => b.Id - a.Id);

        // Find the order with the most recent BuyDate
        let mostRecentOrder = orders.reduce((latestOrder, currentOrder) => {
            return currentOrder.BuyDate > latestOrder.BuyDate ? currentOrder : latestOrder;
        }, orders[0]);

        // Update the last purchase date
        if (orders.length > 0) {
            const lastPurchaseDate = formatDate(mostRecentOrder.BuyDate);
            lastPurchaseContainer.innerHTML = `<strong>Date of Last Purchase:</strong> ${lastPurchaseDate}`;
        }

        // Calculate top-level summaries
        let totalProfitMinusFees = 0;
        let totalTransactions = orders.length;
        let totalFilledValue = 0;
        let openOrdersValue = 0;

        const weeklyProfits = {};
        const weeklyTransactions = {};

        // Initialize variables for monthly summaries
        const monthlyTransactions = Array(12).fill(0);
        const monthlyFilledValue = Array(12).fill(0);
        const monthlyProfitMinusFees = Array(12).fill(0);

        // Filter orders to only include closed sales
        const closedSales = orders.filter(order => order.SaleDate !== null);

        // Calculate Net Profit (Profit Minus Fees) for closed sales
        let totalNetProfitMinusFees = 0;
        let totalFilledValueClosedSales = 0;

        closedSales.forEach(order => {
            const buyDate = order.BuyDate;
            const orderMonth = buyDate.getMonth();
            const weekNumber = getWeekNumber(buyDate);

            // Update monthly transactions and filled values
            // Update monthly transactions and filled values for closed sales
            monthlyTransactions[orderMonth]++;
            monthlyFilledValue[orderMonth] += order.FilledValue;

            totalFilledValue += order.FilledValue;
            if (!order.SaleDate) {
                openOrdersValue += order.FilledValue;
            }
            totalFilledValueClosedSales += order.FilledValue; // Accumulate filled value for closed sales

            if (order.ProfitMinusFees !== null) {
                totalProfitMinusFees += order.ProfitMinusFees;
                totalNetProfitMinusFees += order.ProfitMinusFees;

                // Update monthly net profit
                monthlyProfitMinusFees[orderMonth] += order.ProfitMinusFees;

                weeklyProfits[weekNumber] = (weeklyProfits[weekNumber] || 0) + order.ProfitMinusFees;
            }

            weeklyTransactions[weekNumber] = (weeklyTransactions[weekNumber] || 0) + 1;
        });

        // Accumulate open order value
        orders.forEach(order => {
            if (!order.SaleDate) {
                openOrdersValue += order.FilledValue;
            }
        });
        const numberOfWeeks = Object.keys(weeklyProfits).length;
        const averageProfitPerWeek = numberOfWeeks > 0 ? totalNetProfitMinusFees / numberOfWeeks : 0;
        const averageTransactionsPerWeek = numberOfWeeks > 0 ? totalTransactions / numberOfWeeks : 0;

        // Calculate Net Profit Percentage for closed sales
        let NetProfitPercentage = 0;
        if (totalFilledValueClosedSales > 0) {
            NetProfitPercentage = (totalNetProfitMinusFees / totalFilledValueClosedSales) * 100;
        }

        // Display Profit Summary at the top (changed to Net Profit)
        const isMobile = window.innerWidth <= 600;
        const decimalPlaces = isMobile ? 1 : 4;

        profitSummaryContainer.innerHTML = `
            <h3>Profit Summary</h3>
            <p><strong>Total Filled Value (Closed Sales):</strong> $${totalFilledValueClosedSales.toFixed(decimalPlaces)}</p>
            <p><strong>Total Net Profit:</strong> $${totalNetProfitMinusFees.toFixed(decimalPlaces)}</p>
            <p><strong>Net Profit Percentage:</strong> ${NetProfitPercentage.toFixed(2)}%</p>
            <hr>
        `;

        // Display Activity Summary (renamed from Summary Totals)
        activitySummaryContainer.innerHTML = `
            <h3>Activity Summary</h3>
            <p><strong>Average Profit Per Week:</strong> $${averageProfitPerWeek.toFixed(2)}</p>
            <p><strong>Average Transactions Per Week:</strong> ${averageTransactionsPerWeek.toFixed(2)}</p>
            <p><strong>Open Orders Value:</strong> $${openOrdersValue.toFixed(2)}</p>
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
                        <th>Net Profit</th>
                    </tr>
                </thead>
                <tbody>
                    ${months.map((month, index) => `
                        <tr>
                            <td>${month}</td>
                            <td>${monthlyTransactions[index]}</td>
                            <td>$${monthlyFilledValue[index].toFixed(decimalPlaces)}</td>
                            <td>$${monthlyProfitMinusFees[index].toFixed(decimalPlaces)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        monthlySummaryContainer.innerHTML = monthlySummaryTable;

        // Transactions Details
        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.classList.add('order');

            orderElement.innerHTML = `
                <p><strong>Order ID:</strong> ${order.Id}</p>
                <p><strong>Buy Date:</strong> ${formatDate(order.BuyDate)}</p>
                <p><strong>Sale Date:</strong> ${order.SaleDate ? formatDate(order.SaleDate) : 'Open'}</p>
                <p><strong>Filled Value:</strong> $${order.FilledValue.toFixed(decimalPlaces)}</p>
                <p><strong>Days Between Buy and Sale:</strong> ${order.DaysBetweenCreateAndSale !== null ? order.DaysBetweenCreateAndSale : 'N/A'}</p>
                <p><strong>Purchase Price:</strong> $${order.PurchasePrice.toFixed(decimalPlaces)}</p>
                <p><strong>Actual Sale Price:</strong> ${order.ActualSalePrice !== null ? `$${order.ActualSalePrice.toFixed(decimalPlaces)}` : 'N/A'}</p>
                <p><strong>Targeted Profit (%):</strong> ${order.TargetedProfitPerc !== null ? `${order.TargetedProfitPerc.toFixed(2)}%` : 'N/A'}</p>
                <p><strong>Profit Flag:</strong> ${order.ProfitFlag}</p>
                <p><strong>Net Profit:</strong> ${order.ProfitMinusFees !== null ? `$${order.ProfitMinusFees.toFixed(decimalPlaces)}` : 'N/A'}</p>
            `;
            ordersContainer.appendChild(orderElement);
        });
    } catch (error) {
        console.error('An error occurred while loading orders:', error);
    }
}

// Helper function to get week number of the year
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
}

// Helper function to format dates as 'YYYY-MM-DD'
function formatDate(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'Invalid Date';
    }
    const year = date.getFullYear();
    const month = (`0${date.getMonth() + 1}`).slice(-2); // Months are zero-indexed
    const day = (`0${date.getDate()}`).slice(-2);
    return `${year}-${month}-${day}`;
}

// Reload data on window resize
window.addEventListener('resize', loadOrders);

// Initial load
loadOrders();