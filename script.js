async function loadOrders() {
    try {
        console.log("Loading orders...");
        const response = await fetch('orders.json');
        if (!response.ok) {
            throw new Error(`Failed to fetch orders.json: ${response.statusText}`);
        }
        const orders = await response.json();

        console.log("Orders fetched successfully:", orders);

        const ordersContainer = document.getElementById('orders');
        const profitSummaryContainer = document.getElementById('profit-summary');
        const monthlySummaryContainer = document.getElementById('monthly-summary');
        const lastPurchaseContainer = document.getElementById('last-purchase');
        const activitySummaryContainer = document.getElementById('activity-summary');

        if (!ordersContainer || !profitSummaryContainer || !monthlySummaryContainer || !lastPurchaseContainer || !activitySummaryContainer) {
            throw new Error("One or more HTML elements not found!");
        }

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

        // Check that orders are correctly parsed
        console.log("Parsed orders:", orders);

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

            // Debugging output to verify month value
            console.log(`Order ID: ${order.Id}, BuyDate: ${buyDate}, Month: ${orderMonth}`);

            // Update monthly transactions and filled values for closed sales
            monthlyTransactions[orderMonth]++;
            monthlyFilledValue[orderMonth] += order.FilledValue;

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

        console.log("Monthly summaries:", { monthlyTransactions, monthlyFilledValue, monthlyProfitMinusFees });

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

        console.log("Top-level summaries calculated.");

        // Display summaries
        const isMobile = window.innerWidth <= 600;
        const decimalPlaces = isMobile ? 1 : 4;

        profitSummaryContainer.innerHTML = `
            <h3>Profit Summary</h3>
            <p><strong>Total Filled Value (Closed Sales):</strong> $${totalFilledValueClosedSales.toFixed(decimalPlaces)}</p>
            <p><strong>Total Net Profit:</strong> $${totalNetProfitMinusFees.toFixed(decimalPlaces)}</p>
            <p><strong>Net Profit Percentage:</strong> ${NetProfitPercentage.toFixed(2)}%</p>
            <hr>
        `;

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

    } catch (error) {
        console.error('An error occurred while loading orders:', error);
        alert('An error occurred while loading data. Check the console for more details.');
    }
}
