"use client";
import { Card } from "@/components/ui/card";
import { useState, useCallback } from "react";

export default function Home() {
    const [handle, setHandle] = useState('');
    const [cheatingStatus, setCheatingStatus] = useState(0);
    const [contestList, setContestList] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);

    const checkHandle = useCallback(async () => {
        try {
            const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user status');
            }
            const r = await response.json();
            const cheatedContests = new Set<string>();

            for (const submission of r.result) {
                if (submission.verdict === 'SKIPPED') {
                    const contestResponse = await fetch(`https://codeforces.com/api/contest.status?contestId=${submission.contestId}&handle=${handle}`);
                    if (!contestResponse.ok) {
                        throw new Error('Failed to fetch contest status');
                    }
                    const data = await contestResponse.json();
                    const isAllSkipped = data.result.every((entry: { verdict: string; author: { participantType: string; }; }) =>
                        entry.verdict === 'SKIPPED' || entry.author.participantType === 'PRACTICE'
                    );
                    if (isAllSkipped) {
                        cheatedContests.add(submission.contestId.toString());
                    }
                }
            }
            return Array.from(cheatedContests);
        } catch (e) {
            console.error("Error checking handle:", e);
            throw e;
        }
    }, [handle]);

    const updateList = useCallback(async (contests: string[]) => {
        try {
            const response = await fetch('https://codeforces.com/api/contest.list?gym=false');
            if (!response.ok) {
                throw new Error('Failed to fetch contest list');
            }
            const data = await response.json();
            const names = data.result
                .filter((contest: { id: { toString: () => string; }; }) => contests.includes(contest.id.toString()))
                .map((contest: { name: any; }) => contest.name);
            return names;
        } catch (e) {
            console.error("Error updating list:", e);
            throw e;
        }
    }, []);

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!handle) return;

        setIsLoading(true);
        setCheatingStatus(0);
        setContestList([]);
        setHasChecked(false);

        try {
            const cheatedContests = await checkHandle();
            if (cheatedContests.length > 0) {
                const contestNames = await updateList(cheatedContests);
                setCheatingStatus(1);
                setContestList(contestNames);
            } else {
                setCheatingStatus(0);
            }
        } catch (error) {
            console.error("Error during check:", error);
            setCheatingStatus(-1); // Indicate an error occurred
        } finally {
            setIsLoading(false);
            setHasChecked(true);
        }
    };

    return (
        <div className={'flex justify-center items-center'}>
            <Card className={'mt-10 w-2xl flex justify-center items-center border-black'}>
                <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                    <div className="sm:mx-auto sm:w-full sm:max-w-md">
                        <img
                            alt="Codeforces Logo"
                            src="https://play-lh.googleusercontent.com/EkSlLWf2-04k5Y5F_MDLqoXPdo0TyZX3zKdCfsEUDqVB7INUypTOd6AVmkE_X7ej3JuR"
                            className="mx-auto h-20 w-auto"
                        />
                        <h2 className="mt-5 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
                            Codeforces Cheat Detector
                        </h2>
                    </div>

                    <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                        <form onSubmit={handleCheck} className="space-y-6">
                            <div>
                                <label htmlFor="codeforces_handle" className="block text-md font-medium leading-6 text-gray-900 flex justify-center">
                                    CodeForces Handle
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="codeforces_handle"
                                        name="codeforces_handle"
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 p-2"
                                        onChange={(e) => setHandle(e.target.value)}
                                        value={handle}
                                    />
                                </div>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Checking...' : 'Check'}
                                </button>
                                {cheatingStatus === 1 && contestList.length > 0 && (
                                    <div className={'text-center mt-2 text-red-500'}>
                                        Cheating Detected In Contests : {contestList.map(contest => {
                                            return <div key={contest} className={'text-red-500'}>{contest}</div>;
                                        }
                                    )}
                                    </div>
                                )}
                                {cheatingStatus === 0 && hasChecked && (
                                    <div className={'text-center mt-2 text-green-500'}>
                                        No cheating detected for {handle}
                                    </div>
                                )}
                                {cheatingStatus === -1 && (
                                    <div className={'text-center mt-2 text-red-500'}>
                                        An error occurred. Please try again.
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </Card>
        </div>
    );
}