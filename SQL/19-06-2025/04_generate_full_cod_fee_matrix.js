const fs = require('fs')
const path = require('path')

// Read depots data
const depotsCSV = fs.readFileSync('depots_rows.csv', 'utf8')

// Parse CSV data - improved to handle quoted fields properly
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n')
  const headers = lines[0].split(',')
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = []
    let current = ''
    let inQuotes = false
    
    // Parse CSV line properly handling quotes
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim()) // Add last value
    
    const row = {}
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }
  
  return rows
}

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c
  return distance
}

// Calculate COD fee based on distance
function calculateCODFee(distanceKm) {
  if (distanceKm === 0) {
    return 0 // Same depot
  } else if (distanceKm <= 10) {
    return 150000 // Fixed fee for short distance
  } else if (distanceKm <= 30) {
    return 350000 // Fixed fee for medium distance
  } else {
    // Base fee + distance rate, rounded to nearest thousand
    const fee = 200000 + (distanceKm * 5000)
    return Math.round(fee / 1000) * 1000
  }
}

// Clean depot name for CSV header
function cleanDepotName(name) {
  // Remove quotes and simplify name
  return name.replace(/"/g, '').replace(/\(.*?\)/g, '').trim()
}

// Main function to generate COD fee matrix
function generateCODFeeMatrix() {
  console.log('🚀 Generating full COD Fee Matrix...')
  
  const depots = parseCSV(depotsCSV)
  console.log(`📊 Found ${depots.length} depots`)
  
  // Debug first depot
  console.log('🔍 First depot:', depots[0])
  console.log('🔍 Latitude:', depots[0].latitude, 'Type:', typeof depots[0].latitude)
  console.log('🔍 Longitude:', depots[0].longitude, 'Type:', typeof depots[0].longitude)
  
  // Create CSV header
  const headers = ['Depot Gốc / Depot Đích']
  depots.forEach(depot => {
    headers.push(`"${cleanDepotName(depot.name)}"`)
  })
  
  // Generate matrix data
  const matrixRows = []
  
  depots.forEach((originDepot, i) => {
    const row = [`"${cleanDepotName(originDepot.name)}"`]
    
    depots.forEach((destDepot, j) => {
      if (i === j) {
        // Same depot
        row.push('0')
      } else {
        // Calculate distance
        const lat1 = parseFloat(originDepot.latitude)
        const lon1 = parseFloat(originDepot.longitude)
        const lat2 = parseFloat(destDepot.latitude)
        const lon2 = parseFloat(destDepot.longitude)
        
        const distance = calculateDistance(lat1, lon1, lat2, lon2)
        const fee = calculateCODFee(distance)
        
        row.push(fee.toString())
      }
    })
    
    matrixRows.push(row)
    console.log(`✅ Processed ${i + 1}/${depots.length}: ${cleanDepotName(originDepot.name)}`)
  })
  
  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...matrixRows.map(row => row.join(','))
  ].join('\n')
  
  // Write to file
  const outputFile = 'cod_fee_matrix_full.csv'
  fs.writeFileSync(outputFile, csvContent, 'utf8')
  
  console.log(`🎉 Generated full COD fee matrix: ${outputFile}`)
  console.log(`📈 Matrix size: ${depots.length} x ${depots.length} = ${depots.length * depots.length} entries`)
  
  // Generate statistics
  const fees = []
  matrixRows.forEach(row => {
    row.slice(1).forEach(fee => {
      const feeValue = parseInt(fee)
      if (feeValue > 0) {
        fees.push(feeValue)
      }
    })
  })
  
  const minFee = Math.min(...fees)
  const maxFee = Math.max(...fees)
  const avgFee = fees.reduce((a, b) => a + b, 0) / fees.length
  
  console.log(`📊 Fee Statistics:`)
  console.log(`   Min fee: ${minFee.toLocaleString('vi-VN')} VNĐ`)
  console.log(`   Max fee: ${maxFee.toLocaleString('vi-VN')} VNĐ`)
  console.log(`   Average fee: ${Math.round(avgFee).toLocaleString('vi-VN')} VNĐ`)
  console.log(`   Total non-zero entries: ${fees.length}`)
  
  return outputFile
}

// Run the generator
if (require.main === module) {
  try {
    const outputFile = generateCODFeeMatrix()
    console.log(`✨ Full COD fee matrix generated successfully: ${outputFile}`)
  } catch (error) {
    console.error('💥 Error generating COD fee matrix:', error)
    process.exit(1)
  }
}

module.exports = { generateCODFeeMatrix } 