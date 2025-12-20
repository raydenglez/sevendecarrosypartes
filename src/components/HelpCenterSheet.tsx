import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface HelpCenterSheetProps {
  open: boolean;
  onClose: () => void;
}

export function HelpCenterSheet({ open, onClose }: HelpCenterSheetProps) {
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('helpCenter.faq.howToPublish.question'),
      answer: t('helpCenter.faq.howToPublish.answer'),
    },
    {
      question: t('helpCenter.faq.howToContact.question'),
      answer: t('helpCenter.faq.howToContact.answer'),
    },
    {
      question: t('helpCenter.faq.howToFavorite.question'),
      answer: t('helpCenter.faq.howToFavorite.answer'),
    },
    {
      question: t('helpCenter.faq.howToEditListing.question'),
      answer: t('helpCenter.faq.howToEditListing.answer'),
    },
    {
      question: t('helpCenter.faq.howToDeleteAccount.question'),
      answer: t('helpCenter.faq.howToDeleteAccount.answer'),
    },
    {
      question: t('helpCenter.faq.safetyTips.question'),
      answer: t('helpCenter.faq.safetyTips.answer'),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl flex flex-col">
        <SheetHeader className="pb-4 flex-shrink-0">
          <SheetTitle className="text-xl flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            {t('helpCenter.title')}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">{t('helpCenter.description')}</p>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 pb-6">
          {/* FAQ Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('helpCenter.faqTitle')}
            </h3>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="bg-muted/50 rounded-xl border-none px-4"
                >
                  <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {t('helpCenter.needMoreHelp')}
            </h3>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-auto py-4"
              onClick={() => window.open('mailto:support@carnetworx.com', '_blank')}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">{t('helpCenter.emailSupport')}</p>
                <p className="text-sm text-muted-foreground">support@carnetworx.com</p>
              </div>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}