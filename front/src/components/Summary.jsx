/*1. /api/create-customer
Receives org name and email.

Calls Stripe API to create a customer in Stripe.

Returns the Stripe customerId.

2. /api/submit-consent
Receives organizationId, customerId, and agreed.

If agreed is false, rejects request with 400.

Otherwise, saves consent info to Firestore in collection organizationConsents:

Stores customerId (Stripe customer reference)

agreedAt: Timestamp of consent

terms: The revenue share (30%) and per-click fee ($0.50) <details className=""></details>*/






/*//the adcontainer receives all ads you place them in a specific page at your own laxury where you want and when you want the adbanner does the tracking and saving infomation*/