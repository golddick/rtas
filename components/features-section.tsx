'use client'

import { Container } from './container'
import { Card, CardContent } from './card-component'
import { Upload, Eye, Users, BarChart3, Bell, Database } from 'lucide-react'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const features: Feature[] = [
  {
    icon: <Upload className="w-8 h-8 text-primary" />,
    title: 'Easy Topic Submission',
    description: 'Submit your research topics with a few clicks through our intuitive submission form',
  },
  {
    icon: <Eye className="w-8 h-8 text-primary" />,
    title: 'Real-time Tracking',
    description: 'Know exactly where your proposal stands at every stage of the approval process',
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: 'Supervisor Dashboard',
    description: 'Manage all student proposals in one place with powerful filtering and sorting',
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    title: 'HOD Oversight',
    description: 'Monitor departmental research activity with comprehensive analytics and reports',
  },
  {
    icon: <Bell className="w-8 h-8 text-primary" />,
    title: 'Automated Notifications',
    description: 'Get email alerts at every stage to stay informed about your research topics',
  },
  {
    icon: <Database className="w-8 h-8 text-primary" />,
    title: 'Approved Topics Repository',
    description: 'Search and access previously approved topics for reference and learning',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-background">
      <Container maxWidth="2xl" animated>
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Powerful Features for Everyone
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Comprehensive tools designed for students, supervisors, HODs, and administrators
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                animated
                hover
                className="group"
              >
                <CardContent className="pt-6">
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
