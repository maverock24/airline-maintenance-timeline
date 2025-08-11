#!/bin/bash

# Backend Logging Test Script
# Tests various logging scenarios for the Airline Maintenance Timeline API

echo "🚀 Testing Backend Logging System"
echo "=================================="
echo ""

# Test 1: Health Check
echo "📊 Testing Health Check..."
curl -s http://localhost:3001/api/health > /dev/null
echo "✅ Health check completed"

# Test 2: Valid Flight Request
echo "✈️  Testing Valid Flight Request..."
curl -s "http://localhost:3001/api/flights?limit=3" > /dev/null
echo "✅ Flight request completed"

# Test 3: Invalid Parameter
echo "❌ Testing Error Handling..."
curl -s "http://localhost:3001/api/flights?limit=-1" > /dev/null
echo "✅ Error handling tested"

# Test 4: 404 Error
echo "🔍 Testing 404 Error..."
curl -s "http://localhost:3001/api/nonexistent" > /dev/null
echo "✅ 404 error tested"

# Test 5: Work Packages
echo "🔧 Testing Work Packages..."
curl -s "http://localhost:3001/api/work-packages?limit=2" > /dev/null
echo "✅ Work packages tested"

echo ""
echo "📝 Log File Summary:"
echo "==================="
ls -la /home/maverock24/gitrepos/airline-maintenance-timeline/backend/logs/*.log

echo ""
echo "📋 Recent Combined Log Entries:"
echo "==============================="
tail -10 /home/maverock24/gitrepos/airline-maintenance-timeline/backend/logs/combined-2025-08-12.log

echo ""
echo "🎯 Access Log Sample:"
echo "===================="
tail -5 /home/maverock24/gitrepos/airline-maintenance-timeline/backend/logs/access-2025-08-12.log

echo ""
echo "✅ Logging test completed!"
