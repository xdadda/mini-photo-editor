/* Test moon filter application via control bus
 *
 * This test verifies that the moon filter can be applied
 * and that the parameters are set correctly.
 *
 * Run with: ./rexxt tests/test-moon-filter.rexx
 */

ADDRESS TEST

SAY "==================================="
SAY "Photo Editor - Moon Filter Test"
SAY "==================================="
SAY ""

/* Connect to photo editor control bus */
SAY "Connecting to photo editor..."
ADDRESS "http://localhost:8083/api/photoeditor" AUTH "dev-token-12345" AS PHOTO

/* Test 1: Get version */
SAY "Test 1: Get control bus version"
LET version = "getVersion"
ADDRESS TEST
EXPECT version.version EQUALS "1.0"
EXPECT version.name EQUALS "Mini Photo Editor Control Bus"
SAY "  ✓ Version: " || version.version
SAY ""

/* Test 2: Reset to clean state */
SAY "Test 2: Reset to defaults"
ADDRESS PHOTO
LET reset_result = "reset"
ADDRESS TEST
EXPECT reset_result.success EQUALS 1
SAY "  ✓ Reset successful"
SAY ""

/* Test 3: Verify initial filter state */
SAY "Test 3: Verify initial filter state"
ADDRESS PHOTO
LET initial_params = "getAllParameters"
ADDRESS TEST
EXPECT initial_params.parameters.filters.opt EQUALS 0  /* none */
EXPECT initial_params.parameters.filters.mix EQUALS 0
SAY "  ✓ Initial filter: none (index 0)"
SAY ""

/* Test 4: Apply moon filter with intensity 0.8 */
SAY "Test 4: Apply moon filter (intensity 0.8)"
ADDRESS PHOTO
LET moon_result = "applyFilter name=moon intensity=0.8"
ADDRESS TEST
EXPECT moon_result.success EQUALS 1
EXPECT moon_result.filter EQUALS "moon"
EXPECT moon_result.index EQUALS 20      /* moon = index 20 */
EXPECT moon_result.intensity EQUALS 0.8
SAY "  ✓ Moon filter applied successfully"
SAY "    - Filter index: " || moon_result.index
SAY "    - Intensity: " || moon_result.intensity
SAY ""

/* Test 5: Verify filter state after application */
SAY "Test 5: Verify filter parameters in state"
ADDRESS PHOTO
LET after_params = "getAllParameters"
ADDRESS TEST
EXPECT after_params.parameters.filters.opt EQUALS 20  /* moon */
EXPECT after_params.parameters.filters.mix EQUALS 0.8
SAY "  ✓ Filter parameters verified in state"
SAY "    - filters.opt = " || after_params.parameters.filters.opt
SAY "    - filters.mix = " || after_params.parameters.filters.mix
SAY ""

/* Test 6: List all available filters */
SAY "Test 6: List all available filters"
ADDRESS PHOTO
LET filters = "listFilters"
ADDRESS TEST
EXPECT ARRAY_LENGTH(array=filters.filters) EQUALS 27
/* Verify moon is in the list */
LET has_moon = 0
DO i = 0 TO ARRAY_LENGTH(array=filters.filters) - 1
    LET filter_name = ARRAY_GET(array=filters.filters, index=i)
    IF filter_name = "moon" THEN DO
        has_moon = 1
        LEAVE
    END
END
EXPECT has_moon EQUALS 1
SAY "  ✓ Found 27 filters including 'moon'"
SAY ""

/* Test 7: Apply different intensity */
SAY "Test 7: Apply moon filter with different intensity"
ADDRESS PHOTO
LET moon2_result = "applyFilter name=moon intensity=0.5"
ADDRESS TEST
EXPECT moon2_result.intensity EQUALS 0.5
SAY "  ✓ Intensity changed to 0.5"
SAY ""

/* Test 8: Test other moon variant (moon2) */
SAY "Test 8: Apply moon2 filter variant"
ADDRESS PHOTO
LET moon2_variant = "applyFilter name=moon2 intensity=0.7"
ADDRESS TEST
EXPECT moon2_variant.success EQUALS 1
EXPECT moon2_variant.index EQUALS 21  /* moon2 = index 21 */
SAY "  ✓ Moon2 filter applied (index 21)"
SAY ""

/* Test 9: Combine moon filter with brightness */
SAY "Test 9: Combine moon filter with brightness adjustment"
ADDRESS PHOTO
"applyFilter name=moon intensity=0.8"
LET bright_result = "setBrightness value=0.3"
LET combo_params = "getAllParameters"
ADDRESS TEST
EXPECT combo_params.parameters.filters.opt EQUALS 20
EXPECT combo_params.parameters.lights.brightness EQUALS 0.3
SAY "  ✓ Moon filter + brightness adjustment"
SAY "    - Filter: moon (index 20)"
SAY "    - Brightness: 0.3"
SAY ""

/* Test 10: Reset and verify clean slate */
SAY "Test 10: Reset and verify clean state"
ADDRESS PHOTO
"reset"
LET final_params = "getAllParameters"
ADDRESS TEST
EXPECT final_params.parameters.filters.opt EQUALS 0
EXPECT final_params.parameters.lights.brightness EQUALS 0
SAY "  ✓ Reset restored defaults"
SAY ""

SAY "==================================="
SAY "All tests passed! ✓"
SAY "==================================="
SAY ""
SAY "Summary:"
SAY "- Moon filter correctly applied with index 20"
SAY "- Intensity parameter works (tested 0.5, 0.7, 0.8)"
SAY "- Filter state persists in parameters"
SAY "- Can combine filter with other adjustments"
SAY "- Reset restores to clean state"
SAY ""
