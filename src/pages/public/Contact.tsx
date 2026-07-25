import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { Button } from '../../components/ui/Button'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type FormData = z.infer<typeof schema>

export function Contact() {
  const [submitted, setSubmitted] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(_data: FormData) {
    await new Promise(r => setTimeout(r, 800))
    setSubmitted(true)
    reset()
  }

  return (
    <div>
      <section className="bg-primary py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-gold font-semibold text-sm uppercase tracking-widest mb-3">Get In Touch</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-white/60 text-lg">Questions, feedback, or just want to say hello? We'd love to hear from you.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-serif text-xl font-bold text-primary mb-6">Contact Information</h2>
            <div className="space-y-5">
              {[
                { icon: Mail, label: 'Email', value: 'info@nutrigocyelon.com' },
                { icon: Phone, label: 'Phone', value: '074 413 9923' },
                { icon: MapPin, label: 'Address', value: '103/J, Sunflower Garden, Kahathuduwa, Polgasowita' },
                { icon: Clock, label: 'Support Hours', value: 'Tue–Sun, 8 AM – 10 PM' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 bg-light-olive rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                    <p className="text-gray-700 text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-serif text-xl font-bold text-primary mb-2">Message Sent!</h3>
                <p className="text-gray-500">Thanks for reaching out. We'll get back to you within 24 hours.</p>
                <button onClick={() => setSubmitted(false)} className="mt-6 text-sm text-gold hover:text-gold-dark font-medium cursor-pointer">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Full Name</label>
                    <input {...register('name')} placeholder="Jane Smith" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold" />
                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email Address</label>
                    <input {...register('email')} type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold" />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject</label>
                  <input {...register('subject')} placeholder="What's on your mind?" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold" />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Message</label>
                  <textarea {...register('message')} rows={6} placeholder="Tell us more..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gold resize-none" />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message.message}</p>}
                </div>
                <Button type="submit" size="lg" loading={isSubmitting}>Send Message</Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
