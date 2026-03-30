'use client'

import Link from 'next/link'
import { Container } from './container'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-primary text-primary-foreground">
      <Container maxWidth="2xl" animated>
        <div className="text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold text-balance">
            Ready to streamline your research process?
          </h2>

          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto text-balance">
            Join hundreds of students, supervisors, and administrators already using RTAS
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="px-8 py-3 bg-primary-foreground text-primary font-semibold rounded-lg hover:opacity-90 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link
              href="#contact"
              className="px-8 py-3 border-2 border-primary-foreground text-primary-foreground font-semibold rounded-lg hover:bg-primary-foreground/10 transition-all duration-300 w-full sm:w-auto text-center"
            >
              Contact Sales
            </Link>
          </div>

          <p className="text-sm text-primary-foreground/70">
            No credit card required. Start your free trial today.
          </p>
        </div>
      </Container>
    </section>
  )
}
