import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import PropTypes from 'prop-types'

// Register Chart.js components
Chart.register(...registerables)

const RSProgressionChart = ({ rsHistory = [] }) => {
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  useEffect(() => {
    if (!rsHistory || rsHistory.length === 0) return
    
    // Format data for the chart
    const labels = rsHistory.map(entry => {
      // Format date to MMM DD
      return new Date(entry.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    })
    
    const rsValues = rsHistory.map(entry => entry.rs)
    const deltaValues = rsHistory.map(entry => entry.delta)
    
    // If chartInstance exists, destroy it before creating a new one
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }
    
    // Create new chart
    const ctx = chartRef.current.getContext('2d')
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'RS',
            data: rsValues,
            fill: false,
            borderColor: 'white',
            tension: 0.1,
            pointBackgroundColor: ctx => {
              const index = ctx.dataIndex
              if (index > 0) {
                const delta = deltaValues[index]
                return delta >= 0 ? '#10B981' : '#EF4444'
              }
              return 'white'
            },
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex
                const rs = rsValues[index]
                const delta = deltaValues[index]
                let deltaText = ''
                
                if (delta > 0) {
                  deltaText = `+${delta}`
                } else if (delta < 0) {
                  deltaText = `${delta}`
                }
                
                return [`RS: ${rs}`, deltaText ? `Change: ${deltaText}` : '']
              }
            },
            backgroundColor: '#000000',
            borderColor: '#FFFFFF',
            borderWidth: 1,
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white',
              font: {
                family: 'Montserrat'
              }
            },
            border: {
              color: 'white'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: 'white',
              font: {
                family: 'Montserrat'
              }
            },
            border: {
              color: 'white'
            },
            beginAtZero: false
          }
        }
      }
    })
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [rsHistory])

  return (
    <div className="bg-black border border-gray-800 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">RS Progression</h3>
      <div className="h-64 w-full">
        {rsHistory && rsHistory.length > 0 ? (
          <canvas ref={chartRef} />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <p className="text-gray-500">No RS history data available</p>
          </div>
        )}
      </div>
    </div>
  )
}

RSProgressionChart.propTypes = {
  rsHistory: PropTypes.array
}

export default RSProgressionChart