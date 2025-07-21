# Adding Phone Numbers to Migration Data

## 📱 Why Phone Numbers Are Required

The badminton app uses phone numbers as the unique identifier for players because:
- Players login with phone number + OTP
- Phone numbers link players across sessions and payments
- Singapore's digital payment system (PayNow) uses phone numbers

## 🔧 How to Add Phone Numbers

### Option 1: Before Migration (Recommended)

**Edit the JSON file directly:**

1. **Open your generated JSON file**
2. **Find the players section:**
```json
{
  "players": [
    {
      "name": "John Doe",
      "phone_number": "",  // Add phone number here
      "is_active": true,
      "notes": "Migrated from Access DB - phone number needs to be added"
    }
  ]
}
```

3. **Add Singapore phone numbers:**
```json
{
  "players": [
    {
      "name": "John Doe", 
      "phone_number": "+6591234567",  // Singapore format
      "is_active": true,
      "notes": "Migrated from Access DB"
    }
  ]
}
```

### Option 2: After Migration

**Add phone numbers in the app:**

1. **Run migration with blank phone numbers**
2. **Go to Players Management page**
3. **Edit each player to add their phone number**
4. **Players won't be able to login until phone numbers are added**

## 📋 Singapore Phone Number Format

### Valid Formats:
- **Mobile:** `+6591234567` (9 digits after +65)
- **Mobile:** `+6581234567` (8 digits after +65) 
- **Landline:** `+6567891234` (8 digits after +65)

### Common Patterns:
- **Mobile starting with 8:** `+6581234567`
- **Mobile starting with 9:** `+6591234567`
- **Landline:** `+6567891234`

## 🔄 Quick Find & Replace

If you have a list of phone numbers, use find & replace in your text editor:

**Find:** `"phone_number": ""`
**Replace:** `"phone_number": "+6591234567"`

Then manually update each number.

## ⚠️ Important Notes

1. **Unique Numbers:** Each player must have a unique phone number
2. **No Duplicates:** The app will reject duplicate phone numbers
3. **Required for Login:** Players can't login without valid phone numbers
4. **PayNow Integration:** Phone numbers are used for payment references

## 🛠️ Bulk Phone Number Tool

If you have many players, create a simple spreadsheet:

| Player Name | Phone Number |
|-------------|-------------|
| John Doe    | +6591234567 |
| Jane Smith  | +6591234568 |

Then use Excel/Google Sheets formulas to generate the JSON format.

## 🔍 Validation

Before migration, ensure:
- ✅ All phone numbers start with `+65`
- ✅ Mobile numbers have 8 digits after `+65`
- ✅ No duplicate phone numbers
- ✅ No blank phone numbers (unless adding later)

The migration tool will show warnings for missing phone numbers during validation.