const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please set environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Read COD Fee Matrix data from CSV file
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

// Function to get depot ID by name with fuzzy matching
async function getDepotIdByName(depotName) {
  // Clean depot name for better matching
  const cleanName = depotName.replace(/"/g, '').trim()
  
  // Try exact match first
  let { data, error } = await supabase
    .from('depots')
    .select('id, name')
    .ilike('name', cleanName)
    .limit(1)
    .single()
  
  if (!error && data) {
    return data.id
  }
  
  // Try partial match by first part before comma or parentheses
  const firstPart = cleanName.split(',')[0].split('(')[0].trim()
  
  const result = await supabase
    .from('depots')
    .select('id, name')
    .ilike('name', `%${firstPart}%`)
    .limit(1)
    .single()
  
  if (!result.error && result.data) {
    console.log(`🔍 Matched "${cleanName}" → "${result.data.name}" (ID: ${result.data.id})`)
    return result.data.id
  }
  
  // Try matching key words (for cases like "Gemadept Đà Nẵng" vs "Gemadept (Genuine Partner) Đà Nẵng")
  const keywords = cleanName.split(' ').filter(word => word.length > 2)
  for (const keyword of keywords) {
    const keywordResult = await supabase
      .from('depots')
      .select('id, name')
      .ilike('name', `%${keyword}%`)
      .limit(5)
    
    if (!keywordResult.error && keywordResult.data && keywordResult.data.length > 0) {
      // Check if we find a depot that contains multiple keywords from the original name
      for (const depot of keywordResult.data) {
        const matchedKeywords = keywords.filter(kw => 
          depot.name.toLowerCase().includes(kw.toLowerCase())
        )
        if (matchedKeywords.length >= 2) { // At least 2 keywords match
          console.log(`🔍 Matched "${cleanName}" → "${depot.name}" (ID: ${depot.id}) [Keywords: ${matchedKeywords.join(', ')}]`)
          return depot.id
        }
      }
    }
  }
  
  console.warn(`⚠️ Could not find depot: "${cleanName}"`)
  return null
}

// Calculate distance using Haversine formula (for distance_km field)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Get depot coordinates for distance calculation
async function getDepotCoordinates(depotId) {
  const { data, error } = await supabase
    .from('depots')
    .select('latitude, longitude')
    .eq('id', depotId)
    .single()
  
  if (error || !data) return null
  
  return {
    lat: parseFloat(data.latitude),
    lon: parseFloat(data.longitude)
  }
}

// Main import function
async function importCodFeeMatrix() {
  console.log('🚀 Starting COD Fee Matrix import to existing table...')
  
  try {
    // Parse CSV data
    const { headers, rows } = parseCSV(codFeeMatrixCSV)
    
    console.log(`📊 Found ${rows.length} origin depots and ${headers.length} destination depots`)
    
    // Get all depot IDs and coordinates
    const depotMapping = {}
    const depotCoords = {}
    
    console.log('🔍 Mapping depot names to IDs...')
    
    // Map origin depot IDs
    for (const row of rows) {
      if (!depotMapping[row.originDepot]) {
        const depotId = await getDepotIdByName(row.originDepot)
        if (depotId) {
          depotMapping[row.originDepot] = depotId
          depotCoords[depotId] = await getDepotCoordinates(depotId)
        }
      }
    }
    
    // Map destination depot IDs
    for (const header of headers) {
      if (!depotMapping[header]) {
        const depotId = await getDepotIdByName(header)
        if (depotId) {
          depotMapping[header] = depotId
          depotCoords[depotId] = await getDepotCoordinates(depotId)
        }
      }
    }
    
    console.log(`🏢 Successfully mapped ${Object.keys(depotMapping).length} depots`)
    
    // Clear existing data
    console.log('🧹 Clearing existing COD fee matrix data...')
    const { error: deleteError } = await supabase
      .from('cod_fee_matrix')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (deleteError) {
      console.warn('⚠️ Error clearing existing data:', deleteError.message)
    } else {
      console.log('✅ Existing data cleared successfully')
    }
    
    // Prepare fee matrix data
    const feeMatrixData = []
    let skippedCount = 0
    
    console.log('💰 Preparing fee matrix data...')
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const originDepotId = depotMapping[row.originDepot]
      
      if (!originDepotId) {
        console.warn(`⚠️ Skipping row for unknown origin depot: ${row.originDepot}`)
        skippedCount++
        continue
      }
      
      for (let j = 0; j < headers.length; j++) {
        const destinationDepot = headers[j]
        const destinationDepotId = depotMapping[destinationDepot]
        const fee = row.fees[j]
        
        if (!destinationDepotId) {
          console.warn(`⚠️ Skipping unknown destination depot: ${destinationDepot}`)
          skippedCount++
          continue
        }
        
        // Calculate distance if coordinates available
        let distance_km = null
        if (depotCoords[originDepotId] && depotCoords[destinationDepotId] && originDepotId !== destinationDepotId) {
          const originCoords = depotCoords[originDepotId]
          const destCoords = depotCoords[destinationDepotId]
          
          if (originCoords && destCoords) {
            distance_km = calculateDistance(
              originCoords.lat, originCoords.lon,
              destCoords.lat, destCoords.lon
            )
          }
        } else if (originDepotId === destinationDepotId) {
          distance_km = 0 // Same depot
        }
        
        feeMatrixData.push({
          origin_depot_id: originDepotId,
          destination_depot_id: destinationDepotId,
          fee: fee,
          distance_km: distance_km ? Math.round(distance_km * 100) / 100 : null // Round to 2 decimal places
        })
      }
      
      if ((i + 1) % 5 === 0) {
        console.log(`📈 Processed ${i + 1}/${rows.length} origin depots`)
      }
    }
    
    console.log(`💰 Prepared ${feeMatrixData.length} fee matrix entries`)
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped ${skippedCount} entries due to missing depot mappings`)
    }
    
    // Insert new data in batches
    const batchSize = 100
    let insertedCount = 0
    let errorCount = 0
    
    console.log('📥 Inserting data in batches...')
    
    for (let i = 0; i < feeMatrixData.length; i += batchSize) {
      const batch = feeMatrixData.slice(i, i + batchSize)
      
      const { data, error } = await supabase
        .from('cod_fee_matrix')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message)
        errorCount += batch.length
        continue
      }
      
      insertedCount += batch.length
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(feeMatrixData.length / batchSize)} (${insertedCount}/${feeMatrixData.length} records)`)
    }
    
    console.log(`🎉 COD Fee Matrix import completed!`)
    console.log(`✅ Successfully inserted: ${insertedCount} records`)
    if (errorCount > 0) {
      console.log(`❌ Failed to insert: ${errorCount} records`)
    }
    
    // Verify data
    const { count, error: countError } = await supabase
      .from('cod_fee_matrix')
      .select('*', { count: 'exact', head: true })
    
    if (!countError) {
      console.log(`📈 Total records in cod_fee_matrix table: ${count}`)
    }
    
    // Show some sample data
    const { data: sampleData } = await supabase
      .from('cod_fee_matrix')
      .select(`
        fee,
        distance_km,
        origin_depot:depots!fk_origin_depot(name),
        destination_depot:depots!fk_destination_depot(name)
      `)
      .limit(5)
    
    if (sampleData && sampleData.length > 0) {
      console.log('\n📋 Sample data:')
      sampleData.forEach(row => {
        console.log(`   ${row.origin_depot.name} → ${row.destination_depot.name}: ${row.fee.toLocaleString('vi-VN')} VNĐ ${row.distance_km ? `(${row.distance_km}km)` : ''}`)
      })
    }
    
  } catch (error) {
    console.error('💥 Import failed:', error)
    process.exit(1)
  }
}

// Run the import
if (require.main === module) {
  importCodFeeMatrix()
    .then(() => {
      console.log('\n✨ Import process completed successfully!')
      console.log('🎯 Next steps:')
      console.log('   1. Verify data in your Supabase dashboard')
      console.log('   2. Test COD fee calculation in your application')
      console.log('   3. The COD request dialog should now show real fees!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Import process failed:', error)
      process.exit(1)
    })
}

module.exports = { importCodFeeMatrix } 