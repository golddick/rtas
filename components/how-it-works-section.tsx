'use client'

import { Container } from './container'
import { Card, CardContent } from './card-component'

interface Step {
  number: number
  title: string
  description: string
}

const steps: Step[] = [
  {
    number: 1,
    title: 'HOD Allocates Supervisor',
    description: 'Head of Department assigns qualified supervisors to students for their research projects',
  },
  {
    number: 2,
    title: 'Student Submits Topic',
    description: 'Students upload their research proposals with detailed information and supporting documents',
  },
  {
    number: 3,
    title: 'Supervisor Reviews',
    description: 'Assigned supervisors review, approve, request revisions, or provide constructive feedback',
  },
  {
    number: 4,
    title: 'Final Approval',
    description: 'Topic is officially approved and added to the research repository for future reference',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="py-20 md:py-32 bg-secondary/20">
      <Container maxWidth="2xl" animated>
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              A streamlined 4-step process that simplifies research topic approval
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col items-center">
                  {/* Step Number Circle */}
                  <div className="mb-6 w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-sm hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>

                  {/* Card */}
                  <Card
                    animated
                    hover
                    className="w-full"
                  >
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground text-sm text-center leading-relaxed">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
