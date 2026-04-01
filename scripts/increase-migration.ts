/**
 * Migration Increase Script
 * 
 * Safely increases migration percentage after verifying metrics
 * 
 * Usage: npx tsx scripts/increase-migration.ts --target 25
 */

import { featureFlags } from '@/infrastructure/feature-flags/FeatureFlags'
import { rolloutController } from '@/infrastructure/migration/RolloutController'

async function increaseMigration() {
  const targetPercentage = parseInt(process.argv[2] || '25', 10)

  console.log('═══════════════════════════════════════════')
  console.log(`  📈 MIGRATION INCREASE TO ${targetPercentage}%`)
  console.log('═══════════════════════════════════════════')
  console.log()

  const endpoints = [
    { path: '/api/orders', flag: 'v2-orders-create' },
    { path: '/api/orders/:id', flag: 'v2-orders-get' }
  ]

  for (const endpoint of endpoints) {
    console.log(`\n📊 Checking ${endpoint.path}...`)

    const status = rolloutController.getStatus(endpoint.flag, endpoint.path)

    console.log(`  Current:        ${status.currentPercentage}%`)
    console.log(`  Recommendation: ${status.recommendation}`)
    console.log(`  Can Advance:    ${status.canAdvance}`)

    if (status.metrics) {
      console.log(`  V2 Success:     ${status.metrics.v2SuccessRate?.toFixed(1)}%`)
      console.log(`  V2 Error Rate:  ${status.metrics.v2ErrorRate?.toFixed(2)}%`)
      console.log(`  V2 Avg Latency: ${status.metrics.v2AvgLatency?.toFixed(0)}ms`)
    }

    if (status.currentPercentage < targetPercentage) {
      featureFlags.setPercentage(endpoint.flag, targetPercentage)
      console.log(`  ✅ Increased to ${targetPercentage}%`)
    } else {
      console.log(`  ⏭️  Already at ${status.currentPercentage}%`)
    }
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('  ✅ MIGRATION INCREASE COMPLETE')
  console.log('═══════════════════════════════════════════\n')
}

increaseMigration().catch(console.error)
