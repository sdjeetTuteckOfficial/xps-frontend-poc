// lineageData.ts
export interface ColumnInfo {
  name: string;
  dataType: string;
  isPrimaryKey?: boolean;
}

export interface TableInfo {
  id: string;
  name: string;
  schema: string;
  layer: 'bronze' | 'silver' | 'gold';
  columns: ColumnInfo[];
}

export interface ColumnLineage {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  transformation?: string;
}

export const sampleTables: TableInfo[] = [
  // BRONZE: Raw Source Systems
  {
    id: 'b_crm_users',
    name: 'CRM_Users',
    schema: 'Raw_Salesforce',
    layer: 'bronze',
    columns: [
      { name: 'uuid', dataType: 'UUID', isPrimaryKey: true },
      { name: 'email_addr', dataType: 'VARCHAR' },
      { name: 'first_nm', dataType: 'VARCHAR' },
      { name: 'last_nm', dataType: 'VARCHAR' },
      { name: 'created_at', dataType: 'TIMESTAMP' },
    ],
  },
  {
    id: 'b_erp_subs',
    name: 'ERP_Subscriptions',
    schema: 'Raw_SAP',
    layer: 'bronze',
    columns: [
      { name: 'sub_id', dataType: 'INT', isPrimaryKey: true },
      { name: 'user_uuid', dataType: 'UUID' },
      { name: 'plan_type', dataType: 'VARCHAR' },
      { name: 'monthly_amt', dataType: 'DECIMAL' },
    ],
  },
  // SILVER: Normalized Entities
  {
    id: 's_dim_customers',
    name: 'Dim_Customers',
    schema: 'Core',
    layer: 'silver',
    columns: [
      { name: 'customer_key', dataType: 'BIGINT', isPrimaryKey: true },
      { name: 'source_id', dataType: 'UUID' },
      { name: 'full_name', dataType: 'VARCHAR' },
      { name: 'email', dataType: 'VARCHAR' },
      { name: 'is_active', dataType: 'BOOLEAN' },
    ],
  },
  {
    id: 's_fact_subs',
    name: 'Fact_Subscriptions',
    schema: 'Core',
    layer: 'silver',
    columns: [
      { name: 'sub_key', dataType: 'BIGINT', isPrimaryKey: true },
      { name: 'customer_key', dataType: 'BIGINT' },
      { name: 'revenue', dataType: 'DECIMAL' },
      { name: 'start_date', dataType: 'DATE' },
    ],
  },
  // GOLD: Analytics Ready
  {
    id: 'g_mrr_report',
    name: 'Rpt_Monthly_Revenue',
    schema: 'Analytics',
    layer: 'gold',
    columns: [
      { name: 'report_month', dataType: 'DATE' },
      { name: 'total_mrr', dataType: 'DECIMAL' },
      { name: 'customer_count', dataType: 'INT' },
    ],
  },
];

export const columnLineage: ColumnLineage[] = [
  // CRM -> Dim Customers
  { id: 'l1', sourceTable: 'b_crm_users', sourceColumn: 'uuid', targetTable: 's_dim_customers', targetColumn: 'source_id', transformation: 'Direct' },
  { id: 'l2', sourceTable: 'b_crm_users', sourceColumn: 'email_addr', targetTable: 's_dim_customers', targetColumn: 'email', transformation: 'Lowercase' },
  { id: 'l3', sourceTable: 'b_crm_users', sourceColumn: 'first_nm', targetTable: 's_dim_customers', targetColumn: 'full_name', transformation: 'Concat' },
  // ERP -> Fact Subs
  { id: 'l4', sourceTable: 'b_erp_subs', sourceColumn: 'monthly_amt', targetTable: 's_fact_subs', targetColumn: 'revenue', transformation: 'Currency Conv' },
  { id: 'l5', sourceTable: 'b_erp_subs', sourceColumn: 'user_uuid', targetTable: 's_dim_customers', targetColumn: 'source_id', transformation: 'Lookup' },
  // Silver -> Gold
  { id: 'l6', sourceTable: 's_fact_subs', sourceColumn: 'revenue', targetTable: 'g_mrr_report', targetColumn: 'total_mrr', transformation: 'SUM()' },
  { id: 'l7', sourceTable: 's_dim_customers', sourceColumn: 'customer_key', targetTable: 'g_mrr_report', targetColumn: 'customer_count', transformation: 'COUNT()' },
];