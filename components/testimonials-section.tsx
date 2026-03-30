'use client'

import { Container } from './container'
import { Card, CardContent } from './card-component'
import { Star } from 'lucide-react'

interface Testimonial {
  quote: string
  name: string
  role: string
  department: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'RTAS has completely transformed how I manage my research topics. The platform is intuitive and saves me hours of paperwork.',
    name: 'Sarah Johnson',
    role: 'Student',
    department: 'Computer Science',
  },
  {
    quote: 'As a supervisor, I can now review and approve student proposals in minutes instead of days. Highly recommended!',
    name: 'Prof. Ahmed Hassan',
    role: 'Supervisor',
    department: 'Engineering',
  },
  {
    quote: 'The analytics dashboard gives me unprecedented insight into departmental research activity. Essential tool for HOD oversight.',
    name: 'Dr. Margaret Chen',
    role: 'Head of Department',
    department: 'Physics',
  },
  {
    quote: 'Managing research topics across multiple supervisors and students has never been easier. RTAS is a game-changer.',
    name: 'Prof. James Wilson',
    role: 'Supervisor',
    department: 'Biology',
  },
  {
    quote: 'The approval workflow is transparent and fair. I always know exactly where my proposal stands.',
    name: 'Michael Okonkwo',
    role: 'Student',
    department: 'Mathematics',
  },
  {
    quote: 'Automating notifications has reduced miscommunication dramatically. Our research process is more efficient than ever.',
    name: 'Dr. Lisa Anderson',
    role: 'Head of Department',
    department: 'Literature',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-32 bg-background">
      <Container maxWidth="2xl" animated>
        <div className="space-y-16">
          {/* Section Header */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Loved by Researchers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Hear from students, supervisors, and department heads about their experience
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                animated
                hover
                className="flex flex-col"
              >
                <CardContent className="pt-6 flex flex-col gap-4 flex-1">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} className="fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-foreground leading-relaxed flex-1">
                    {`"${testimonial.quote}"`}
                  </p>

                  {/* Author */}
                  <div className="pt-4 border-t border-border">
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} • {testimonial.department}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
