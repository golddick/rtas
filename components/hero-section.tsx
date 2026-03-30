'use client'

import Link from 'next/link'
import { Container } from './container'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-secondary/20">
      <Container maxWidth="2xl" animated>
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 animate-fade-in">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span className="text-sm font-medium text-primary">Now available for universities</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold text-balance text-foreground leading-tight animate-slide-up">
            Research Topic Approval Workflow System
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance animate-slide-up">
            Streamline your research supervision process from allocation to approval. A comprehensive platform designed for students, supervisors, and department heads.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-scale-in">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Get Started
              <ArrowRight size={20} />
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Learn More
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 border-t border-border">
            <div className="text-center animate-slide-up">
              <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
              <p className="text-sm text-muted-foreground mt-2">Active Students</p>
            </div>
            <div className="text-center animate-slide-up">
              <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
              <p className="text-sm text-muted-foreground mt-2">Supervisors</p>
            </div>
            <div className="text-center animate-slide-up">
              <div className="text-3xl md:text-4xl font-bold text-primary">10</div>
              <p className="text-sm text-muted-foreground mt-2">Departments</p>
            </div>
            <div className="text-center animate-slide-up">
              <div className="text-3xl md:text-4xl font-bold text-primary">1000+</div>
              <p className="text-sm text-muted-foreground mt-2">Approved Topics</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
