const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read COD Fee Matrix data from generated CSV file
const codFeeMatrixCSV = fs.readFileSync('cod_fee_matrix_full.csv', 'utf8')

// Function to parse CSV data - improved to handle quoted fields properly
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n')
  const headers = []
  const rows = []
  
  // Parse header line
  const headerLine = lines[0]
  let current = ''
  let inQuotes = false
  
  for (let j = 0; j < headerLine.length; j++) {
    const char = headerLine[j]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      headers.push(current.trim().replace(/"/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  headers.push(current.trim().replace(/"/g, '')) // Add last header
  
  // Parse data lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values = []
    current = ''
    inQuotes = false
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/"/g, ''))
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim().replace(/"/g, '')) // Add last value
    
    rows.push({
      originDepot: values[0],
      fees: values.slice(1).map(fee => parseInt(fee))
    })
  }
  
  return { headers: headers.slice(1), rows }
}

// Function to get depot ID by name
async function getDepotIdByName(depotName) {
  const { data, error } = await supabase
    .from('depots')
    .select('id')
    .ilike('name', `%${depotName.split(',')[0].trim()}%`)
    .limit(1)
    .single()
  
  if (error) {
    console.warn(`Could not find depot: ${depotName}`)
    return null
  }
  
  return data?.id
}

// Main import function
async function importCodFeeMatrix() {
  console.log('🚀 Starting COD Fee Matrix import...')
  
  try {
    // Parse CSV data
    const { headers, rows } = parseCSV(codFeeMatrixCSV)
    
    console.log(`📊 Found ${rows.length} origin depots and ${headers.length} destination depots`)
    
    // Get all depot IDs
    const depotIds = {}
    
    // Get origin depot IDs
    for (const row of rows) {
      const depotId = await getDepotIdByName(row.originDepot)
      if (depotId) {
        depotIds[row.originDepot] = depotId
      }
    }
    
    // Get destination depot IDs
    for (const header of headers) {
      if (!depotIds[header]) {
        const depotId = await getDepotIdByName(header)
        if (depotId) {
          depotIds[header] = depotId
        }
      }
    }
    
    console.log(`🏢 Mapped ${Object.keys(depotIds).length} depots to IDs`)
    
    // Prepare fee matrix data
    const feeMatrixData = []
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const originDepotId = depotIds[row.originDepot]
      
      if (!originDepotId) {
        console.warn(`⚠️ Skipping row for unknown origin depot: ${row.originDepot}`)
        continue
      }
      
      for (let j = 0; j < headers.length; j++) {
        const destinationDepot = headers[j]
        const destinationDepotId = depotIds[destinationDepot]
        const fee = row.fees[j]
        
        if (!destinationDepotId) {
          console.warn(`⚠️ Skipping unknown destination depot: ${destinationDepot}`)
          continue
        }
        
        feeMatrixData.push({
          origin_depot_id: originDepotId,
          destination_depot_id: destinationDepotId,
          fee: fee,
          distance_km: fee === 0 ? 0 : null // Same depot = 0 distance
        })
      }
    }
    
    console.log(`💰 Prepared ${feeMatrixData.length} fee matrix entries`)
    
    // Clear existing data
    console.log('🧹 Clearing existing COD fee matrix data...')
    const { error: deleteError } = await supabase
      .from('cod_fee_matrix')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) {
      console.warn('⚠️ Error clearing existing data:', deleteError.message)
    }
    
    // Insert new data in batches
    const batchSize = 100
    let insertedCount = 0
    
    for (let i = 0; i < feeMatrixData.length; i += batchSize) {
      const batch = feeMatrixData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('cod_fee_matrix')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        continue
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(feeMatrixData.length / batchSize)} (${insertedCount}/${feeMatrixData.length} records)`)
    }
    
    console.log(`🎉 COD Fee Matrix import completed! Inserted ${insertedCount} records.`)
    
    // Verify data
    const { count } = await supabase
      .from('cod_fee_matrix')
      .select('*', { count: 'exact', head: true })
    
    console.log(`📈 Total records in cod_fee_matrix table: ${count}`)
    
  } catch (error) {
    console.error('💥 Import failed:', error)
    process.exit(1)
  }
}

// Run the import
if (require.main === module) {
  importCodFeeMatrix()
    .then(() => {
      console.log('✨ Import process completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error)
      process.exit(1)
    })
}

module.exports = { importCodFeeMatrix } 