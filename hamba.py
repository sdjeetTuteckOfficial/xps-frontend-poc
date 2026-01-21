# 

import pandas as pd
import json
import os

# --- Configuration ---
file_path = "Salesforce_Insurance_DataModel.xlsx"
target_entity = 'Account'

# --- Load Data ---
# Ensure you are reading the correct sheets
df_entities = pd.read_excel(file_path, sheet_name="Salesforce Entities")
df_attributes = pd.read_excel(file_path, sheet_name="Detailed Attribute List")

# --- Preprocessing ---
# Clean column names and handle missing values
if 'Unnamed: 7' in df_entities.columns:
    df_entities = df_entities.rename(columns={'Unnamed: 7': 'Description'})

df_entities['Description'] = df_entities['Description'].fillna('')
df_attributes['Field Name'] = df_attributes['Field Name'].fillna('')
df_attributes['Relationship/RefersTo'] = df_attributes['Relationship/RefersTo'].fillna('')

# --- Logic to Build Lineage ---

# 1. Identify Outgoing Relationships (Account -> Other)
# Filter attributes of Account that have a relationship defined
account_attrs = df_attributes[df_attributes['Object'] == target_entity]
outgoing_rels = account_attrs[account_attrs['Relationship/RefersTo'] != '']

# 2. Identify Incoming Relationships (Other -> Account)
# Filter attributes of OTHER objects that refer to Account
# Note: Uses regex to match 'Account' even in comma-separated lists (e.g., polymorphic fields)
incoming_rels = df_attributes[
    df_attributes['Relationship/RefersTo'].str.contains(fr'\b{target_entity}\b', regex=True, na=False)
]

# 3. Identify all unique Nodes involved
related_entities = set()
related_entities.add(target_entity)

# Add targets from outgoing relationships
for refs in outgoing_rels['Relationship/RefersTo'].unique():
    for ref in refs.split(','): # Handle comma-separated values
        if ref.strip():
            related_entities.add(ref.strip())

# Add sources from incoming relationships
for obj in incoming_rels['Object'].unique():
    related_entities.add(obj)

# --- Construct React Flow Nodes ---
nodes = []
# Create a lookup for descriptions
desc_map = dict(zip(df_entities['Object'], df_entities['Description']))

for entity in related_entities:
    # Get all attributes for this entity to include in node data
    # (Useful if you want to display the schema inside the node)
    entity_attrs = df_attributes[df_attributes['Object'] == entity][['Field Name', 'Data Type']]
    attributes_list = entity_attrs.to_dict('records')
    
    # Basic positioning logic (Placeholder)
    # Put Account in the center, others at 0,0 (let a layout library handle it, or calculate circular positions here)
    position = {"x": 250, "y": 250} if entity == target_entity else {"x": 0, "y": 0}
    
    node = {
        "id": entity,
        "type": "default", # Use 'custom' if you have a custom component for displaying attributes
        "data": {
            "label": entity,
            "description": desc_map.get(entity, ""),
            "attributes": attributes_list # Schema Info
        },
        "position": position
    }
    nodes.append(node)

# --- Construct React Flow Edges ---
edges = []
edge_counter = 0

# Add Outgoing Edges (Account -> Target)
for _, row in outgoing_rels.iterrows():
    targets = row['Relationship/RefersTo'].split(',')
    attr_name = row['Field Name']
    
    for target in targets:
        target = target.strip()
        if not target: continue
        
        edges.append({
            "id": f"e{edge_counter}",
            "source": target_entity,
            "target": target,
            "label": attr_name, # The attribute creating the relationship
            "animated": True,
            "style": {"stroke": "#333"},
            "data": {
                "relationshipType": "Outgoing",
                "map": f"{target_entity}.{attr_name} -> {target}.Id" # Attribute Map hint
            }
        })
        edge_counter += 1

# Add Incoming Edges (Source -> Account)
for _, row in incoming_rels.iterrows():
    source = row['Object']
    attr_name = row['Field Name']
    
    # Verify this specific row points to Account (in case of multiple targets)
    targets = [t.strip() for t in row['Relationship/RefersTo'].split(',')]
    if target_entity in targets:
        edges.append({
            "id": f"e{edge_counter}",
            "source": source,
            "target": target_entity,
            "label": attr_name,
            "animated": True,
            "style": {"stroke": "#007bff"},
            "data": {
                "relationshipType": "Incoming",
                "map": f"{source}.{attr_name} -> {target_entity}.Id"
            }
        })
        edge_counter += 1

# --- Output ---
react_flow_data = {
    "nodes": nodes,
    "edges": edges
}

print(f"Generated {len(nodes)} nodes and {len(edges)} edges.")

# Save to JSON
with open("account_lineage_reactflow.json", "w") as f:
    json.dump(react_flow_data, f, indent=4)