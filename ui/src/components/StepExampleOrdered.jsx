import React from 'react'
import { Step } from 'semantic-ui-react'

const steps = [
  { completed: true, title: 'Shipping', description: 'Choose your shipping options' },
  { completed: true, title: 'Billing', description: 'Enter billing information' },
  { active: true, title: 'Confirm Order', description: 'Verify order details' },
]

const StepExampleOrdered = () => (
  <Step.Group ordered items={steps} />
)

export default StepExampleOrdered
