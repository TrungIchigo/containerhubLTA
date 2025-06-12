'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import StarRating from '@/components/ui/star-rating'
import { MessageSquare, Star } from 'lucide-react'
import { submitReview } from '@/lib/actions/reviews'
import { toast } from '@/hooks/use-toast'

interface ReviewDialogProps {
  requestId: string
  revieweeOrgId: string
  revieweeOrgName: string
  children: React.ReactNode
}

export default function ReviewDialog({
  requestId,
  revieweeOrgId,
  revieweeOrgName,
  children
}: ReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn số sao đánh giá",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      await submitReview({
        requestId,
        revieweeOrgId,
        rating,
        comment: comment.trim() || null
      })

      toast({
        title: "Thành công",
        description: "Đánh giá của bạn đã được gửi thành công",
      })

      // Reset form và đóng dialog
      setRating(0)
      setComment('')
      setIsOpen(false)

    } catch (error) {
      console.error('Error submitting review:', error)
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setIsOpen(false)
      setRating(0)
      setComment('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Đánh giá giao dịch
          </DialogTitle>
          <DialogDescription>
            Đánh giá giao dịch với <strong>{revieweeOrgName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Section */}
          <div className="space-y-2">
            <Label htmlFor="rating">
              Đánh giá chung <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <StarRating
                value={rating}
                onChange={setRating}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                {rating > 0 ? `${rating} sao` : 'Chưa chọn'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Hãy đánh giá mức độ hài lòng của bạn với đối tác này
            </p>
          </div>

          {/* Comment Section */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Nhận xét (tùy chọn)
            </Label>
            <Textarea
              id="comment"
              placeholder="Chia sẻ kinh nghiệm làm việc với đối tác này..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Nhận xét sẽ được hiển thị công khai</span>
              <span>{comment.length}/500</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className="bg-primary hover:bg-primary-dark"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang gửi...
              </>
            ) : (
              'Gửi Đánh Giá'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 