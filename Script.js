document.addEventListener('DOMContentLoaded', function() {
    let investmentChart;
    const ctx = document.getElementById('investmentGraph').getContext('2d');
    document.getElementById('simulateBtn').addEventListener('click', function() {
        const multiplier = parseFloat(document.getElementById('investmentType').value);
        const investment = parseFloat(document.getElementById('investmentInput').value || 0);
        if (investment <= 0) {
            alert('Please enter a valid investment amount greater than 0.');
            return;
        }
        const baseData = [investment, investment * multiplier, investment * Math.pow(multiplier, 2)];
        const data = {
            labels: ['Initial', 'Year 1', 'Year 2'],
            datasets: [{
                label: 'Projected Returns',
                backgroundColor: ['#007bff', '#6610f2', '#6f42c1'],
                data: baseData
            }]
        };
        if (investmentChart) {
            investmentChart.destroy();
        }
        investmentChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: {
                scales: {
                    y: { beginAtZero: true }
                },
                animation: {
                    duration: 800
                }
            }
        });
    });
});