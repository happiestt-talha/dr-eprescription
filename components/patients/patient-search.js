"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { normalizeText } from "@/lib/search";

const DEBOUNCE_MS = 300;

// Per-portal row action: doctors prescribe, reception books a visit.
const ACTIONS = {
  doctor: { href: (id) => `/doctor/prescriptions/new?patientId=${id}`, label: "Prescribe", short: "Prescribe", Icon: Plus },
  receptionist: { href: (id) => `/receptionist/appointments/new?patientId=${id}`, label: "Book Visit", short: "Book", Icon: CalendarPlus },
};

// The same fields the server searches (substring match on each).
function rowMatches(patient, query) {
  const q = normalizeText(query.trim());
  return [patient.fullName, patient.phone, patient.cnic, patient.patientCode].some((field) =>
    normalizeText(field).includes(q)
  );
}

/**
 * Patient lookup that searches as you type. Patients are the one list too big
 * to load whole, so it searches the server, but only when it has to:
 * - narrowing a query whose results were complete (fewer than `limit`) is
 *   answered instantly from the rows already loaded, with no request;
 * - anything else waits DEBOUNCE_MS and asks the server once.
 */
export function PatientSearch({ basePath, portal, initialQuery, initialResults, limit }) {
  const router = useRouter();
  const action = ACTIONS[portal];
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  // The last query this component sent to the server. If the server query
  // changes to something else (back/forward, a link), adopt it in the input.
  const requested = useRef(initialQuery);
  useEffect(() => {
    if (initialQuery !== requested.current) {
      requested.current = initialQuery;
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Results and the query that produced them come from the server (props).
  const serverQuery = initialQuery;
  const results = initialResults;
  const complete = results.length < limit;

  const trimmed = query.trim();
  const narrowsLoaded =
    Boolean(serverQuery) && complete && normalizeText(trimmed).startsWith(normalizeText(serverQuery));
  const needsServer = trimmed !== serverQuery && !narrowsLoaded;

  useEffect(() => {
    if (!needsServer) return;
    const timer = setTimeout(() => {
      requested.current = trimmed;
      startTransition(() => {
        router.replace(trimmed ? `${basePath}?q=${encodeURIComponent(trimmed)}` : basePath, { scroll: false });
      });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [needsServer, trimmed, basePath, router]);

  const visible = useMemo(
    () => (trimmed && trimmed !== serverQuery ? results.filter((p) => rowMatches(p, trimmed)) : results),
    [results, trimmed, serverQuery]
  );
  const searching = isPending || (needsServer && Boolean(trimmed));

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3 w-full sm:max-w-md">
        <SearchInput
          value={query}
          onValueChange={setQuery}
          placeholder="Search by name, phone, CNIC or patient ID"
          autoFocus
        />
        {searching ? (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Searching
          </span>
        ) : null}
      </div>

      {!trimmed ? (
        <div className="text-center text-muted-foreground py-16 border border-dashed rounded-xl bg-card/50">
          <Search className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
          <h3 className="font-semibold text-foreground">Search Patient Database</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Start typing a patient name, phone number, CNIC, or patient ID. Results appear as you type.
          </p>
        </div>
      ) : visible.length === 0 && searching ? (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground border border-dashed rounded-xl bg-card/50" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Searching patients…
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center text-muted-foreground py-12 border border-dashed rounded-xl bg-card">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="font-medium text-foreground">No patients found</p>
          <p className="text-xs text-muted-foreground mt-1">
            No records matching &ldquo;{trimmed}&rdquo;. Register them as a new patient above.
          </p>
        </div>
      ) : (
        <div className={searching ? "opacity-60 transition-opacity" : "transition-opacity"}>
          {/* Mobile Card View (below md: 768px) */}
          <div className="md:hidden space-y-3">
            {visible.map((patient) => (
              <div key={patient.id} className="border border-border/60 rounded-xl p-4 bg-card space-y-3 shadow-xs">
                <div className="flex items-start justify-between border-b pb-2.5">
                  <div>
                    <h2 className="font-semibold text-base text-foreground">{patient.fullName}</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">{patient.patientCode}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium bg-muted text-muted-foreground">
                    {patient.gender} · {patient.age ? `${patient.age}y` : "—"}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground">{patient.phone}</span>
                  </div>
                  {patient.cnic && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">CNIC:</span>
                      <span className="font-mono text-foreground">{patient.cnic}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full min-h-[40px] text-xs" nativeButton={false} render={<Link href={`${basePath}/${patient.id}`} className="flex-1" />}>
                    View Profile
                  </Button>
                  <Button size="sm" className="w-full min-h-[40px] text-xs" nativeButton={false} render={<Link href={action.href(patient.id)} className="flex-1" />}>
                    {action.label}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Tablet Table (>= md: 768px) */}
          <div className="hidden md:block rounded-xl border border-border/60 overflow-hidden bg-card shadow-xs">
            <Table className="min-w-[600px] w-full">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Patient Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Gender / Age</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <Link href={`${basePath}/${patient.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {patient.patientCode}
                      </Link>
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <Link href={`${basePath}/${patient.id}`} className="hover:underline">
                        {patient.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">{patient.phone}</TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {patient.gender} · {patient.age ? `${patient.age} yrs` : "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-medium" nativeButton={false} render={<Link href={`${basePath}/${patient.id}`} />}>
                        Profile
                      </Button>
                      <Button size="sm" className="h-8 text-xs font-medium shadow-xs" nativeButton={false} render={<Link href={action.href(patient.id)} />}>
                        <action.Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                        {action.short}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {!complete && trimmed === serverQuery ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing the first {limit} matches. Keep typing to narrow the results.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
