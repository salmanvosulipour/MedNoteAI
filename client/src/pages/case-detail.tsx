import { MobileLayout } from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Share2, Download, Printer, Edit3, Camera, Mic } from "lucide-react";
import { Link, useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function CaseDetailPage() {
  const [, params] = useRoute("/cases/:id");
  const id = params?.id || "new";

  return (
    <MobileLayout showNav={false}>
      <header className="px-4 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-800">
        <Link href="/cases">
          <a className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </a>
        </Link>
        <span className="font-semibold text-sm">Case #{id}</span>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Share2 className="w-4 h-4" />
        </Button>
      </header>

      <ScrollArea className="flex-1">
        <div className="p-6 pb-24">
          {/* Patient Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-heading font-bold">Sarah Connor</h1>
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Completed</Badge>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-3">
              <span>34 yrs</span>
              <span>•</span>
              <span>Female</span>
              <span>•</span>
              <span>Oct 25, 2023 - 14:30</span>
            </div>
          </div>

          {/* AI Summary Card */}
          <Card className="border-none shadow-md bg-white dark:bg-slate-900 mb-6 overflow-hidden">
             <div className="h-1 bg-gradient-to-r from-primary to-accent" />
             <CardContent className="p-5 space-y-6">
                
                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chief Complaint (CC)</h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    Patient presents with persistent migraine headaches accompanied by visual aura and photosensitivity.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">History of Present Illness (HPI)</h3>
                  <p className="text-sm leading-relaxed text-foreground">
                    The patient reports a 3-week history of throbbing left-sided headaches. She describes the pain as 7/10 in severity. The headaches are preceded by visual disturbances (flashing lights) lasting 15-20 minutes. Nausea is present during episodes. OTC analgesics have provided minimal relief. No history of head trauma.
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Review of Systems (ROS)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-foreground">
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">General</span>
                      <p>Negative for fever, chills, weight loss.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">HEENT</span>
                      <p>Positive for photophobia. Negative for neck stiffness.</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">Neurologic</span>
                      <p>Positive for visual aura (flashing lights).</p>
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-muted-foreground block mb-1">GI</span>
                      <p>Positive for nausea. Negative for vomiting.</p>
                    </div>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Physical Exam</h3>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-lg p-3 text-sm text-foreground space-y-2">
                    <p><span className="font-semibold">Vitals:</span> BP 120/80, HR 72, RR 16, Temp 98.6°F</p>
                    <p><span className="font-semibold">General:</span> Alert and oriented x3, in mild distress due to pain.</p>
                    <p><span className="font-semibold">HEENT:</span> PERRL, EOMI. Fundoscopic exam normal. No papilledema.</p>
                    <p><span className="font-semibold">Neuro:</span> Cranial nerves II-XII intact. Strength 5/5 in all extremities. Sensation intact. Gait normal. Negative Kernig/Brudzinski.</p>
                  </div>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment / Differential Diagnosis</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Migraine with aura (primary suspect)</span>
                      <span className="text-xs font-mono bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded">G43.109</span>
                    </li>
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Tension-type headache</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">G44.209</span>
                    </li>
                    <li className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <span className="text-sm text-foreground">Cluster headache</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-2 py-0.5 rounded">G44.009</span>
                    </li>
                  </ul>
                </section>

                <Separator />

                <section>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Plan</h3>
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-md text-sm font-mono text-foreground space-y-2">
                    <p>1. Start Sumatriptan 50mg at onset of headache.</p>
                    <p>2. Keep headache diary for 2 weeks.</p>
                    <p>3. MRI Brain to rule out secondary causes due to new onset.</p>
                    <p>4. Follow up in 3 weeks.</p>
                  </div>
                </section>
             </CardContent>
          </Card>

          {/* Attachments */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4 text-primary" />
              Attachments
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                <span className="text-xs text-slate-400">Scan 1</span>
              </div>
              <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                 <span className="text-xs text-slate-400">Lab Result</span>
              </div>
              <button className="aspect-square border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1 shadow-lg shadow-primary/20" size="lg">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Note
            </Button>
            <Button variant="outline" size="lg" className="px-4">
              <Download className="w-4 h-4" />
            </Button>
             <Button variant="outline" size="lg" className="px-4">
              <Printer className="w-4 h-4" />
            </Button>
          </div>

        </div>
      </ScrollArea>
    </MobileLayout>
  );
}
