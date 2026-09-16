#!/usr/bin/env python3
"""
Test the exact yield the user is getting to verify the grading
"""

def test_user_yield_grading():
    """Test grading for user's actual yield of 23.1-27.1 kg/are"""
    
    # New realistic thresholds (same as updated constants.js)
    MAIZE_THRESHOLDS = {
        'poor': 10.0,
        'avg': 17.0, 
        'good': 24.0,
        'excellent': 30.0
    }
    
    def get_grade(yield_val):
        if yield_val >= MAIZE_THRESHOLDS['excellent']:
            return 'Excellent', '🏆'
        elif yield_val >= MAIZE_THRESHOLDS['good']:
            return 'Good', '⭐'
        elif yield_val >= MAIZE_THRESHOLDS['avg']:
            return 'Average', '📊'
        else:
            return 'Below Average', '❌'
    
    print("🧪 TESTING USER'S ACTUAL YIELD RANGE")
    print("=" * 50)
    
    # Test the range from user's screenshot: 23.1-27.1 kg/are
    test_yields = [23.1, 25.0, 27.1]
    
    for yield_val in test_yields:
        grade, emoji = get_grade(yield_val)
        print(f"{yield_val:4.1f} kg/are → {emoji} {grade}")
    
    print("\n📏 THRESHOLD REFERENCE:")
    print(f"Below Average: < {MAIZE_THRESHOLDS['avg']:.1f} kg/are")
    print(f"Average:     ≥ {MAIZE_THRESHOLDS['avg']:.1f} kg/are")
    print(f"Good:        ≥ {MAIZE_THRESHOLDS['good']:.1f} kg/are")
    print(f"Excellent:   ≥ {MAIZE_THRESHOLDS['excellent']:.1f} kg/are")
    
    # Check if user's range should be Good
    user_min, user_max = 23.1, 27.1
    min_grade, _ = get_grade(user_min)
    max_grade, _ = get_grade(user_max)
    
    print(f"\n✅ EXPECTED RESULT:")
    print(f"User's range {user_min}-{user_max} kg/are should show: {min_grade} to {max_grade}")
    
    if min_grade in ['Good', 'Excellent']:
        print("🎉 SUCCESS: User should now see Good/Excellent grades!")
        print("If still showing 'Below Average', the frontend needs to refresh")
    else:
        print("❌ Issue: User should get better grades with this yield")

if __name__ == "__main__":
    test_user_yield_grading()