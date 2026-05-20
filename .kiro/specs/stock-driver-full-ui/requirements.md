# Requirements Document

## Introduction

This document specifies the requirements for the complete UI implementation of the Stock Driver System frontend. The system is a logistics/inventory management application with role-based access (admin, inventory, accountant). The backend API, state management layer, and authentication are already implemented. This spec covers all remaining UI pages, reusable components, and interactive workflows needed to make the application fully functional.

## Glossary

- **Dashboard_Home**: The main overview page showing real-time metrics from the reports API
- **Data_Table**: A reusable table component supporting pagination, sorting, search, and row actions
- **Modal**: A reusable overlay dialog for create/edit forms and confirmations
- **Toast_System**: A notification system for displaying success, error, and info messages
- **Inventory_Module**: The set of pages for managing categories, suppliers, items, stock entries, adjustments, and purchase orders
- **Fleet_Module**: The set of pages for managing drivers, stock requests, and payments
- **Team_Module**: The admin-only page for user CRUD, role assignment, and status management
- **Audit_Module**: The admin-only page for viewing audit logs with filters and pagination
- **Reports_Page**: The page displaying charts and summaries from the reports API
- **Glass_Panel**: The existing glassmorphism design pattern used for card/container styling
- **Resource_Store**: The existing vanilla state store pattern providing load, create, update, and filter operations
- **Pagination_Controls**: A reusable component for navigating paginated data sets

## Requirements

### Requirement 1: Reusable Data Table Component

**User Story:** As a developer, I want a reusable data table component, so that all list views share consistent behavior for pagination, search, and row actions.

#### Acceptance Criteria

1. THE Data_Table SHALL render rows from a provided data array where each column definition specifies at minimum a field key and a header label, and optionally a custom cell renderer function that receives the row object
2. THE Data_Table SHALL display a search input that calls the store's load method with a search parameter after a debounce delay of 300 milliseconds from the last keystroke
3. THE Data_Table SHALL display Pagination_Controls showing the current page number, total pages, a previous-page button, and a next-page button, derived from the store's meta object (page, pages, total)
4. WHEN a user clicks the previous-page or next-page pagination button, THE Data_Table SHALL call the store's load method with the corresponding page number
5. WHEN the data array is empty and the store loading flag is false, THE Data_Table SHALL display a configurable empty state message that defaults to "No records found"
6. WHILE the store loading flag is true, THE Data_Table SHALL display a loading indicator in place of the table rows
7. THE Data_Table SHALL accept an optional actions column renderer as a function that receives the row object and returns action elements for that row
8. IF the store error value is non-null after a load call, THEN THE Data_Table SHALL display an error message indicating the failure and provide a retry control that re-invokes the store's load method with the current filters

### Requirement 2: Reusable Modal Component

**User Story:** As a developer, I want a reusable modal component, so that create and edit forms are presented consistently across all modules.

#### Acceptance Criteria

1. THE Modal SHALL render as a fixed-position overlay covering the full viewport with a semi-transparent backdrop, and a glass-panel styled container centered both horizontally and vertically
2. THE Modal SHALL accept a title (string), children content (React node), and an onClose callback (function) as props
3. WHEN a user clicks the backdrop area outside the container or the close button, THE Modal SHALL invoke the onClose callback
4. WHILE the Modal is open, THE Modal SHALL trap keyboard focus so that pressing Tab from the last focusable element moves focus to the first focusable element, and pressing Shift+Tab from the first focusable element moves focus to the last focusable element
5. THE Modal SHALL animate in and out using Framer Motion with scale (from 0.95 to 1) and opacity (from 0 to 1) transitions over a duration of 200ms
6. WHEN the Escape key is pressed while the Modal is open, THE Modal SHALL invoke the onClose callback
7. THE Modal SHALL render with role="dialog", aria-modal="true", and an aria-labelledby attribute referencing the modal title element

### Requirement 3: Toast Notification System

**User Story:** As a user, I want to see success and error notifications after actions, so that I know whether my operations succeeded or failed.

#### Acceptance Criteria

1. THE Toast_System SHALL display notification messages in a fixed container positioned at the top-right of the viewport, with each toast having a maximum text length of 150 characters (truncated with ellipsis if exceeded)
2. THE Toast_System SHALL support success, error, and info message variants, each rendered with a visually distinguishable background color unique to that variant
3. WHEN a toast is displayed, THE Toast_System SHALL auto-dismiss the toast after 4 seconds
4. THE Toast_System SHALL animate toasts in and out using Framer Motion slide and fade transitions with a duration of 300 milliseconds
5. WHEN multiple toasts are active, THE Toast_System SHALL stack them vertically with 8px spacing, displaying a maximum of 5 toasts simultaneously, where the oldest toast is removed when the limit is exceeded
6. WHEN the user clicks the dismiss button on a toast, THE Toast_System SHALL immediately remove that toast with the exit animation
7. THE Toast_System SHALL render each toast with an ARIA role of "status" for info and success variants and "alert" for error variants to support screen reader accessibility

### Requirement 4: Dashboard Home with Real Metrics

**User Story:** As a user, I want the dashboard home page to show real metrics from the API, so that I can see an overview of system status at a glance.

#### Acceptance Criteria

1. WHEN the Dashboard_Home mounts, THE Dashboard_Home SHALL call reportStore.loadDashboard to fetch metrics
2. WHEN reportStore.loadDashboard resolves successfully, THE Dashboard_Home SHALL display exactly 5 metric cards showing: total items count, low stock items count, active drivers count, pending stock requests count, and unpaid requests count, each with a numeric value and a descriptive label
3. WHILE the reportStore loading flag is true, THE Dashboard_Home SHALL display one loading skeleton placeholder per metric card (5 total) in place of metric values
4. IF the reportStore returns an error, THEN THE Dashboard_Home SHALL display an error message indicating that dashboard metrics failed to load, along with a retry button
5. WHEN the user clicks the retry button, THE Dashboard_Home SHALL re-invoke reportStore.loadDashboard
6. THE Dashboard_Home SHALL render each metric card as a glass-card styled container with an associated Lucide React icon per metric

### Requirement 5: Inventory Categories Management

**User Story:** As an inventory user, I want to view, create, and edit item categories, so that I can organize inventory items.

#### Acceptance Criteria

1. WHEN the categories page mounts, THE Inventory_Module SHALL call inventoryStores.categories.load to fetch the category list and display a loading indicator until the response is received
2. THE Inventory_Module SHALL display categories in a Data_Table with columns for name, description, and actions
3. WHEN the user clicks the "Add Category" button, THE Inventory_Module SHALL open a Modal with a form containing a required name field (maximum 150 characters) and an optional description field
4. WHEN the user submits the create form with valid data, THE Inventory_Module SHALL call inventoryStores.categories.create with the form data and disable the submit button until the operation completes
5. WHEN the user clicks the edit action on a row, THE Inventory_Module SHALL open a Modal pre-filled with the category name and description
6. WHEN the user submits the edit form with valid data, THE Inventory_Module SHALL call inventoryStores.categories.update with the category ID and form data and disable the submit button until the operation completes
7. WHEN a create or update operation succeeds, THE Toast_System SHALL display a success message and THE Inventory_Module SHALL close the Modal
8. IF the user submits the category form with an empty name or a name exceeding 150 characters, THEN THE Inventory_Module SHALL display a validation error message adjacent to the name field and SHALL NOT submit the request
9. IF a create or update operation fails, THEN THE Toast_System SHALL display an error message indicating the failure reason and THE Inventory_Module SHALL keep the Modal open with the form data preserved

### Requirement 6: Inventory Suppliers Management

**User Story:** As an inventory user, I want to manage suppliers, so that I can track where inventory items are sourced from.

#### Acceptance Criteria

1. WHEN the suppliers page mounts, THE Inventory_Module SHALL call inventoryStores.suppliers.load to fetch the supplier list
2. THE Inventory_Module SHALL display suppliers in a Data_Table with columns for name, phone, email, and actions
3. WHEN the user clicks "Add Supplier", THE Inventory_Module SHALL open a Modal with a form containing fields for name (required, max 150 characters), phone (optional, max 50 characters), email (optional, valid email format, max 150 characters), address (optional), notes (optional), and status (optional, "active" or "inactive")
4. WHEN the user submits the create form with valid data, THE Inventory_Module SHALL call inventoryStores.suppliers.create with the form data and prepend the new supplier to the displayed list
5. WHEN the user clicks the edit action on a row, THE Inventory_Module SHALL open a Modal pre-filled with the supplier data using the same form fields as the create form
6. WHEN the user submits the edit form with valid data, THE Inventory_Module SHALL call inventoryStores.suppliers.update with the supplier ID and form data and replace the updated row in the displayed list
7. WHEN a create or update operation succeeds, THE Toast_System SHALL display a success message and the Modal SHALL close
8. IF the user submits the supplier form with the name field empty or exceeding 150 characters, THEN THE Inventory_Module SHALL display a validation error on the name field and prevent form submission
9. IF a create or update API call fails, THEN THE Inventory_Module SHALL display an error message via the Toast_System and keep the Modal open with the form data preserved

### Requirement 7: Inventory Items Management

**User Story:** As an inventory user, I want to manage inventory items with stock levels, so that I can track what is available in the warehouse.

#### Acceptance Criteria

1. WHEN the items page mounts, THE Inventory_Module SHALL call inventoryStores.items.load to fetch the item list
2. THE Inventory_Module SHALL display items in a Data_Table with columns for name, SKU, category, current stock, purchase price, selling price, and actions
3. WHEN the user clicks "Add Item", THE Inventory_Module SHALL open a Modal with a form containing fields for name (required, max 150 characters), SKU (optional, max 100 characters), category selection, supplier selection, unit (default "piece", max 50 characters), purchase price (numeric, minimum 0), selling price (numeric, minimum 0), and minimum stock level (numeric, minimum 0)
4. WHEN the user submits the create form with valid data, THE Inventory_Module SHALL call inventoryStores.items.create with the form data
5. WHEN the user clicks the edit action on a row, THE Inventory_Module SHALL open a Modal pre-filled with the item data including name, SKU, category, supplier, unit, purchase price, selling price, and minimum stock level
6. WHEN the user submits the edit form with valid data, THE Inventory_Module SHALL call inventoryStores.items.update with the item ID and form data
7. THE Inventory_Module SHALL display a colored highlight on rows where the item's current_stock is less than or equal to its minimum_stock value
8. IF the create or update API call fails, THEN THE Inventory_Module SHALL display an error message indicating the failure reason and SHALL preserve the user's form input
9. IF the user submits the form with the name field empty, THEN THE Inventory_Module SHALL display a validation error on the name field and SHALL prevent form submission

### Requirement 8: Stock Entries and Adjustments

**User Story:** As an inventory user, I want to record stock entries and adjustments, so that I can keep stock levels accurate.

#### Acceptance Criteria

1. THE Inventory_Module SHALL provide a "Stock Entry" form accessible from the items page for recording new stock received
2. WHEN the user submits a stock entry form, THE Inventory_Module SHALL call inventoryStores.stockEntries.submit with item_id (positive integer, required), quantity (greater than 0, up to 2 decimal places), unit_cost (0 or greater, up to 2 decimal places), entry_date (ISO date, required), and optionally supplier_id and notes
3. THE Inventory_Module SHALL provide a "Stock Adjustment" form for recording inventory corrections
4. WHEN the user submits a stock adjustment form, THE Inventory_Module SHALL call inventoryStores.stockAdjustments.submit with item_id (positive integer, required), adjustment_type (required), quantity (greater than 0, up to 2 decimal places), and optionally notes
5. THE Inventory_Module SHALL restrict adjustment_type selection to the values defined in STOCK_ADJUSTMENT_TYPES constant ("adjustment_in" and "adjustment_out")
6. WHEN a stock entry or adjustment succeeds, THE Toast_System SHALL display a success message and the items list SHALL refresh
7. IF the stock entry or adjustment submission fails due to an invalid item or insufficient stock, THEN THE Inventory_Module SHALL display an error message indicating the failure reason and SHALL NOT navigate away from the form
8. IF the user submits a stock entry or adjustment form with quantity equal to zero or negative, THEN THE Inventory_Module SHALL prevent submission and display a validation error indicating that quantity must be greater than zero

### Requirement 9: Purchase Orders Management

**User Story:** As an inventory user, I want to create and manage purchase orders, so that I can track procurement from suppliers.

#### Acceptance Criteria

1. WHEN the purchase orders page mounts, THE Inventory_Module SHALL call inventoryStores.purchaseOrders.load to fetch the order list and display results with pagination defaulting to page 1 with 20 items per page
2. THE Inventory_Module SHALL display purchase orders in a Data_Table with columns for order number, supplier, status, total amount, and actions
3. WHEN the user clicks "Create Order", THE Inventory_Module SHALL open a form page using createPurchaseOrderDraft defaults with supplier_id as null, order_date as today, discount_amount as 0, tax_amount as 0, notes as empty, and items as an empty list
4. THE Inventory_Module SHALL allow adding line items with item selection, quantity (greater than 0), and unit cost (minimum 0) fields, requiring at least 1 line item before submission is allowed
5. WHEN the user changes any line item quantity, unit cost, discount, or tax field, THE Inventory_Module SHALL recalculate and display subtotal, discount, tax, and total using calculatePurchaseOrderTotals, ensuring total never falls below 0
6. WHEN the user submits the order, THE Inventory_Module SHALL call inventoryStores.purchaseOrders.create with the complete order payload and, on success, navigate back to the purchase orders list and refresh the list data
7. IF the user submits the order with missing supplier, no line items, or invalid quantities, THEN THE Inventory_Module SHALL display a validation error message indicating the specific missing or invalid fields and prevent submission
8. WHEN the user clicks "Receive" on an order with status "draft", "pending", or "partially_received", THE Inventory_Module SHALL open a receive form allowing entry of received quantities per line item and call inventoryStores.purchaseOrders.receive on submission
9. IF the user enters a received quantity that would cause total received to exceed the ordered quantity for a line item, THEN THE Inventory_Module SHALL display an error message indicating the quantity exceeds the ordered amount and prevent submission
10. WHEN the user clicks "Cancel" on an order with status "draft" or "pending", THE Inventory_Module SHALL display a confirmation dialog and, upon user confirmation, call inventoryStores.purchaseOrders.cancel
11. THE Inventory_Module SHALL display order status using badges for each of the 5 statuses defined in PURCHASE_ORDER_STATUSES: "draft", "pending", "partially_received", "received", and "cancelled", each with a distinct visual style

### Requirement 10: Driver Management

**User Story:** As an accountant user, I want to manage drivers, so that I can track who receives stock and their payment balances.

#### Acceptance Criteria

1. WHEN the drivers page mounts, THE Fleet_Module SHALL call accountantStores.drivers.load to fetch the driver list
2. THE Fleet_Module SHALL display drivers in a Data_Table with columns for name, phone, status, and actions
3. WHEN the user clicks "Add Driver", THE Fleet_Module SHALL open a Modal with a form containing a required full_name field (maximum 150 characters), and optional fields for phone (maximum 50 characters), address, id_number (maximum 100 characters), vehicle_type (maximum 100 characters), vehicle_plate_number (maximum 100 characters), and notes
4. WHEN the user submits the create form with a valid full_name, THE Fleet_Module SHALL call accountantStores.drivers.create with the form data and close the Modal on success
5. IF the create or update call fails, THEN THE Fleet_Module SHALL display the error message returned by the store and keep the Modal open with form data preserved
6. WHEN the user clicks the edit action on a row, THE Fleet_Module SHALL open a Modal pre-filled with the driver data
7. WHEN the user submits the edit form with valid data, THE Fleet_Module SHALL call accountantStores.drivers.update with the driver ID and updated form data and close the Modal on success
8. WHEN the user clicks a status toggle action, THE Fleet_Module SHALL call accountantStores.drivers.setStatus with the driver ID and new status
9. THE Fleet_Module SHALL restrict status values to those defined in ACTIVE_STATUSES constant
10. IF accountantStores.drivers.load fails, THEN THE Fleet_Module SHALL display an error message indicating the driver list could not be loaded

### Requirement 11: Stock Requests Management

**User Story:** As an accountant user, I want to create and manage stock requests for drivers, so that I can track stock dispatched to and returned from drivers.

#### Acceptance Criteria

1. WHEN the stock requests page mounts, THE Fleet_Module SHALL call accountantStores.stockRequests.load to fetch the request list
2. THE Fleet_Module SHALL display stock requests in a Data_Table with columns for request number, driver, type, status, total, and actions
3. WHEN the user clicks "Create Request", THE Fleet_Module SHALL open a form page using createStockRequestDraft defaults with request_type set to "stock_out", discount_amount set to 0, request_date set to today's date, and an empty items array
4. THE Fleet_Module SHALL allow adding line items with item selection, quantity (greater than 0), and unit_price (0 or greater) fields, requiring at least 1 line item before submission
5. WHEN a line item quantity or unit_price changes, or when discount_amount changes, THE Fleet_Module SHALL recalculate and display subtotal, discount, and total using calculateStockRequestTotals where total equals subtotal minus discount (minimum 0)
6. WHEN the user submits the request, THE Fleet_Module SHALL validate that a driver is selected and at least 1 line item exists, then call accountantStores.stockRequests.create with the complete request payload
7. IF the stock request creation API call fails, THEN THE Fleet_Module SHALL display an error message indicating the failure reason and preserve the form data
8. WHEN the user clicks "Complete" on a non-completed and non-cancelled request, THE Fleet_Module SHALL display a confirmation dialog and upon confirmation call accountantStores.stockRequests.complete
9. WHEN the user clicks "Cancel" on a non-completed request, THE Fleet_Module SHALL display a confirmation dialog and upon confirmation call accountantStores.stockRequests.cancel
10. THE Fleet_Module SHALL restrict request type to values defined in REQUEST_TYPES constant ("stock_out", "stock_return")
11. THE Fleet_Module SHALL display request status using color-coded badges with one distinct color per status value defined in REQUEST_STATUSES ("draft", "pending", "approved")

### Requirement 12: Payments Management

**User Story:** As an accountant user, I want to record payments from drivers, so that I can track financial settlements.

#### Acceptance Criteria

1. WHEN the payments page mounts, THE Fleet_Module SHALL call accountantStores.payments.load to fetch the payment list
2. THE Fleet_Module SHALL display payments in a Data_Table with columns for date, driver, amount, method, and payment number
3. WHEN the user clicks "Record Payment", THE Fleet_Module SHALL open a Modal with a form containing fields for stock request selection, amount (numeric, greater than 0), payment method, payment date, and notes
4. THE Fleet_Module SHALL restrict payment method selection to values defined in PAYMENT_METHODS constant ('cash', 'bank_transfer', 'other')
5. WHEN the user submits the payment form, THE Fleet_Module SHALL call accountantStores.payments.create with the form data including stock_request_id, amount, payment_method, payment_date, and notes
6. WHEN a payment is recorded successfully, THE Toast_System SHALL display a success message
7. IF the payment creation request fails, THEN THE Toast_System SHALL display an error message indicating the failure reason and THE Fleet_Module SHALL keep the Modal open with the form data preserved
8. THE Fleet_Module SHALL validate that the amount field contains a value greater than 0 before enabling form submission

### Requirement 13: Team Management (Admin Only)

**User Story:** As an admin, I want to manage system users, so that I can control who has access and what roles they hold.

#### Acceptance Criteria

1. WHEN the team page mounts, THE Team_Module SHALL call adminStores.users.load and adminStores.roles.load to fetch users and available roles
2. THE Team_Module SHALL display users in a Data_Table with columns for full name, email, role, status, and actions
3. WHEN the user clicks "Add User", THE Team_Module SHALL open a Modal with a form for full name (max 150 characters), email (max 150 characters), password (min 6 characters), and role selection from the loaded roles list
4. WHEN the user submits the create form with valid data, THE Team_Module SHALL call adminStores.users.create with the form data and, on success, close the Modal and reload the users list
5. IF the create or update operation fails due to validation errors, THEN THE Team_Module SHALL display the error message returned by the server adjacent to the relevant form field without closing the Modal
6. WHEN the user clicks the edit action on a row, THE Team_Module SHALL open a Modal pre-filled with the user data for editing full name, email, and role
7. WHEN the user clicks a status action, THE Team_Module SHALL call adminStores.users.setStatus with the user ID and new status
8. THE Team_Module SHALL restrict status values to those defined in USER_STATUSES constant (active, inactive, blocked)
9. THE Team_Module SHALL display user status using a visually distinct badge per status value, where each of the three statuses (active, inactive, blocked) is represented by a different color
10. WHILE a create, update, or status change request is in progress, THE Team_Module SHALL disable the submit control to prevent duplicate submissions

### Requirement 14: Audit Logs Viewer (Admin Only)

**User Story:** As an admin, I want to view system audit logs, so that I can monitor user actions and investigate issues.

#### Acceptance Criteria

1. WHEN the audit page mounts, THE Audit_Module SHALL call adminStores.auditLogs.load to fetch the first page of logs with a default page size of 20 rows sorted by timestamp descending (most recent first)
2. THE Audit_Module SHALL display logs in a Data_Table with columns: timestamp (created_at formatted as date and time), user (full name of the acting user), action (the action performed), resource (the module name), and details (a summary of old_data and new_data changes)
3. THE Audit_Module SHALL provide filter controls for date range (start date and end date inputs), user (selection from available users), and action type (selection from available action values), with all filters initially unset so that all logs are shown by default
4. WHEN the user applies filters, THE Audit_Module SHALL call adminStores.auditLogs.load with the selected filter parameters and reset pagination to page 1
5. THE Audit_Module SHALL support pagination through the Data_Table Pagination_Controls, displaying the current page number, total pages, and total record count, with a maximum of 100 rows per page
6. IF adminStores.auditLogs.load returns an error, THEN THE Audit_Module SHALL display an error message indicating the logs could not be loaded and allow the user to retry the request
7. IF the audit log list is empty after loading or filtering, THEN THE Audit_Module SHALL display an empty-state message indicating no audit logs match the current criteria

### Requirement 15: Reports Page

**User Story:** As a user, I want to view reports and summaries, so that I can understand business performance and inventory status.

#### Acceptance Criteria

1. WHEN the reports page mounts, THE Reports_Page SHALL call loadInventorySummary, loadDriverBalances, loadPaymentSummary, and loadPurchaseSummary from the reportStore concurrently
2. THE Reports_Page SHALL display an inventory summary section showing for each item: name, SKU, unit, current stock, minimum stock, purchase price, selling price, and status
3. THE Reports_Page SHALL highlight items where current_stock is less than or equal to minimum_stock as low-stock alerts within the inventory summary section
4. THE Reports_Page SHALL display a driver balances section showing for each driver: full name, phone, status, and outstanding balance (the sum of remaining_amount across the driver's stock requests)
5. THE Reports_Page SHALL display a payment summary section showing payment totals grouped by date, with each row displaying the date and total amount
6. THE Reports_Page SHALL display a purchase summary section showing for each purchase order status (draft, pending, partially_received, received, cancelled): the order count and total amount
7. WHILE the reportStore loading flag is true, THE Reports_Page SHALL display loading skeleton placeholders in place of each report section that has not yet loaded
8. IF the reportStore returns an error, THEN THE Reports_Page SHALL display an error message indicating the failure reason and a retry button that re-invokes all four load functions when clicked
9. IF any report section returns an empty data set, THEN THE Reports_Page SHALL display an empty-state message within that section indicating no records are available

### Requirement 16: Inventory Module Navigation

**User Story:** As an inventory user, I want tab-based navigation within the inventory module, so that I can switch between categories, suppliers, items, and purchase orders.

#### Acceptance Criteria

1. THE Inventory_Module SHALL display a horizontal tab bar with tabs labeled "Categories", "Suppliers", "Items", and "Purchase Orders" in left-to-right order
2. WHEN the user clicks a tab, THE Inventory_Module SHALL display only the selected tab's sub-page content and hide the previously active sub-page
3. THE Inventory_Module SHALL indicate the active tab by applying the accent-blue color to the active tab's text and a visible bottom border, while inactive tabs use the secondary text color
4. WHEN the user first navigates to the Inventory_Module, THE Inventory_Module SHALL display the Items tab as active with its sub-page content visible
5. THE Inventory_Module SHALL support keyboard navigation between tabs using the left and right arrow keys, and tab activation using the Enter or Space key

### Requirement 17: Fleet Module Navigation

**User Story:** As an accountant user, I want tab-based navigation within the fleet module, so that I can switch between drivers, stock requests, and payments.

#### Acceptance Criteria

1. THE Fleet_Module SHALL display a horizontal tab bar with tabs labeled "Drivers", "Stock Requests", and "Payments" in left-to-right order
2. WHEN the user clicks a tab, THE Fleet_Module SHALL display only the selected tab's sub-page content and hide the previously active sub-page
3. THE Fleet_Module SHALL indicate the active tab by applying the accent-blue color to the active tab's text and a visible bottom border, while inactive tabs use the secondary text color
4. WHEN the user first navigates to the Fleet_Module, THE Fleet_Module SHALL display the Stock Requests tab as active with its sub-page content visible
5. THE Fleet_Module SHALL support keyboard navigation between tabs using the left and right arrow keys, and tab activation using the Enter or Space key

### Requirement 18: Form Validation and Error Display

**User Story:** As a user, I want to see validation errors on forms, so that I know what needs to be corrected before submission.

#### Acceptance Criteria

1. WHEN a required field contains an empty value (null, empty string, or whitespace-only) on form submission, THE Modal SHALL display a validation message below that field indicating the field is required, and SHALL NOT submit the form to the API
2. WHEN the user modifies a field that has a validation message displayed, THE Modal SHALL clear the validation message for that field
3. WHEN the API returns a response with a non-empty field-level errors array (status 422), THE Modal SHALL display each error message below its corresponding field identified by the field name
4. IF the API returns a field-level error whose field name does not match any visible form field, THEN THE Toast_System SHALL display that error message as a general notification
5. WHILE the store saving flag is true, THE Modal SHALL disable the submit button to prevent double submission
6. WHEN the API returns an error response without field-level errors (status other than 422, or empty errors array), THE Toast_System SHALL display the error message returned in the response

### Requirement 19: Confirmation Dialogs

**User Story:** As a user, I want confirmation before destructive actions, so that I do not accidentally cancel orders or change statuses.

#### Acceptance Criteria

1. WHEN the user initiates a cancel or status change action, THE Modal SHALL display a confirmation dialog with a title describing the action and a message explaining the consequence
2. THE confirmation dialog SHALL display a "Confirm" button styled with a warning color and a "Cancel" button styled with a neutral color
3. WHEN the user clicks "Confirm", THE Modal SHALL execute the associated action, display a loading state on the confirm button, and close the dialog upon success
4. WHEN the user clicks "Cancel" or presses the Escape key, THE Modal SHALL close without executing the action
5. IF the confirmed action fails, THEN THE Toast_System SHALL display an error message indicating the failure reason and the confirmation dialog SHALL close

### Requirement 20: Responsive Layout

**User Story:** As a user, I want the application to be usable on different screen sizes, so that I can access it from various devices.

#### Acceptance Criteria

1. WHEN the viewport width is below 768px, THE Dashboard_Home SHALL stack metric cards in a single column
2. WHEN the viewport width is below 1024px, THE Data_Table SHALL enable horizontal scrolling for tables whose content width exceeds the available container width
3. WHILE the viewport width is below 768px, THE Modal SHALL not exceed 90% of the viewport width and SHALL have a minimum width of 288px
4. THE application SHALL support viewport widths from 320px to 1920px without content overflow or horizontal page-level scrolling
5. WHEN the viewport width is below 768px, THE application SHALL collapse the sidebar navigation into a toggleable menu accessible via a menu button
