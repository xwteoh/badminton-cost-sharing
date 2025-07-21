# MS Access to JSON Migration Guide

## 🔄 Method 1: CSV Export + Converter Tool (Recommended)

### Step 1: Export Tables from MS Access

1. **Open your MS Access database**
2. **Export each table to CSV:**
   - Right-click table → Export → Text File
   - Choose "Delimited" format with commas
   - Include field names in first row

### Step 2: Clean Your Data

**Players Table** - should include:
```
name,phone,active,joined_date,skill_level,notes
John Doe,91234567,1,15/01/2025,intermediate,Regular player
Jane Smith,91234568,1,01/02/2025,advanced,Team captain
```

**Sessions Table** - should include:
```
date,location,court_rate,shuttle_rate,hours,shuttles,total_cost,participants
15/07/2025,Badminton Hall A,25.00,8.00,2,3,74.00,"John Doe:+6591234567:18.50,Jane Smith:+6591234568:18.50"
```

### Step 3: Use the Converter Tool

1. **Open the converter:** `scripts/csv-to-migration-json.html` in your browser
2. **Convert players:** Paste players CSV in Players tab
3. **Convert sessions:** Paste sessions CSV in Sessions tab  
4. **Get final JSON:** Copy from Final JSON tab
5. **Import:** Paste into the Data Migration Tool

## 🔄 Method 2: PowerQuery/Excel Advanced

### If you have complex data relationships:

1. **Open Excel → Data → Get Data → From Database → From Microsoft Access Database**
2. **Create relationships between tables**
3. **Use Power Query to merge and format data:**

```powerquery
// Example Power Query for Players
let
    Source = Access.Database("your-database.accdb"),
    Players = Source{[Schema="",Item="Players"]}[Data],
    CleanedPlayers = Table.TransformColumns(Players, {
        {"Phone", each "+65" & Text.Replace(_, " ", "")},
        {"JoinedDate", each Date.ToText(_, "yyyy-MM-dd")}
    })
in
    CleanedPlayers
```

## 🔄 Method 3: Direct SQL Export

### If you're comfortable with SQL queries:

**Query for Players:**
```sql
SELECT 
    Name as name,
    "+65" & Replace([Phone], " ", "") as phone_number,
    IIf([Active] = True, 1, 0) as is_active,
    Format([JoinedDate], "yyyy-mm-dd") as joined_at,
    [SkillLevel] as skill_level,
    [Notes] as notes
FROM Players
WHERE [Active] = True
```

**Query for Sessions:**
```sql
SELECT 
    Format([SessionDate], "yyyy-mm-dd") as date,
    [Location] as location_name,
    [CourtRate] as court_rate,
    [ShuttleRate] as shuttle_rate,
    [Hours] as total_hours,
    [Shuttles] as total_shuttles,
    [TotalCost] as total_cost,
    [PlayerCount] as player_count,
    [CostPerPlayer] as cost_per_player
FROM Sessions
ORDER BY [SessionDate]
```

## 📋 Common Data Cleanup Tasks

### Phone Numbers
- **Remove spaces/dashes:** `91234567` → `+6591234567`
- **Add country code:** `91234567` → `+6591234567`
- **Standardize format:** All should be `+65xxxxxxxx`

### Dates
- **Convert to ISO format:** `15/07/2025` → `2025-07-15`
- **Handle various formats:** DD/MM/YYYY, MM/DD/YYYY, etc.

### Boolean Values
- **Active status:** `Yes/No` → `true/false`
- **Recurring sessions:** `True/False` → `true/false`

### Skill Levels
- **Standardize:** `Beginner`, `Intermediate`, `Advanced`, `Expert`
- **Lowercase:** `intermediate`, `advanced`

## 🎯 Final Migration Data Structure

Your final JSON should look like this:

```json
{
  "players": [
    {
      "name": "John Doe",
      "phone_number": "+6591234567",
      "is_active": true,
      "joined_at": "2025-01-15",
      "skill_level": "intermediate",
      "notes": "Regular player"
    }
  ],
  "sessions": [
    {
      "date": "2025-07-15",
      "location_name": "Badminton Hall A",
      "court_rate": 25.00,
      "shuttle_rate": 8.00,
      "total_hours": 2,
      "total_shuttles": 3,
      "total_cost": 74.00,
      "player_count": 4,
      "cost_per_player": 18.50,
      "participants": [
        {
          "player_name": "John Doe",
          "phone_number": "+6591234567",
          "amount_owed": 18.50
        }
      ]
    }
  ]
}
```

## 🚨 Important Notes

1. **Backup first:** Always backup your Access database before starting
2. **Test with small sample:** Try migrating 2-3 records first
3. **Phone number format:** Must be Singapore format `+65xxxxxxxx`
4. **Date format:** Must be `YYYY-MM-DD`
5. **Validate JSON:** Use online JSON validator before importing
6. **One-time operation:** Migration cannot be easily undone

## 🆘 Troubleshooting

### Common Issues:
- **Phone number format errors:** Use find/replace to standardize
- **Date parsing errors:** Convert all dates to YYYY-MM-DD format
- **JSON syntax errors:** Use online JSON validator
- **Missing participant data:** Ensure all players exist before sessions
- **Special characters:** Remove or escape quotes, commas in text fields

### If you get stuck:
1. Export a small sample (5-10 records) first
2. Use the converter tool to check format
3. Test migration with sample data
4. Scale up to full dataset once working